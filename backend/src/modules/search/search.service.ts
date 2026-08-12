import { db, type DbTransaction } from "@/db";
import { searchDocuments, searchEmbeddings } from "@/db/schema";
import { eq, sql, and, ilike } from "drizzle-orm";
import { generateId } from "@/utils";
import { NormalizationService } from "./normalization.service";
import { env } from "@/config/env";

/**
 * Generate an embedding vector for a text payload.
 *
 * Production: when OPENAI_API_KEY is set, uses OpenAI `text-embedding-3-small`
 * (1536 dims, matches the stored vector size).
 * Development/test: deterministic hashed vector so indexes are stable and
 * tests run without external calls. The fallback is NEVER used when a key is
 * configured (and production env enforces the key via config/env.ts).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = env.OPENAI_API_KEY?.trim();
    if (apiKey) {
        const res = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "text-embedding-3-small",
                input: text.slice(0, 8000),
            }),
        });
        if (!res.ok) {
            const detail = await res.text().catch(() => "");
            throw new Error(`OpenAI embedding failed (${res.status}): ${detail.slice(0, 200)}`);
        }
        const body = (await res.json()) as { data?: { embedding?: number[] }[] };
        const embedding = body.data?.[0]?.embedding;
        if (!embedding) throw new Error("OpenAI embedding returned no vector");
        return embedding;
    }

    // Deterministic dev/test fallback (stable across runs; not used in prod).
    return hashVector(text, 1536);
}

function hashVector(text: string, dims: number): number[] {
    const out: number[] = [];
    let seed = 2166136261;
    for (let i = 0; i < dims; i++) {
        seed ^= text.charCodeAt(i % Math.max(text.length, 1));
        seed = Math.imul(seed, 16777619);
        out.push(((seed >>> 0) % 1000) / 1000);
    }
    return out;
}

export class SearchService {
    // --- Indexing ---

    async indexDocument(
        tenantId: string,
        entityType: "PRODUCT" | "STORE",
        entityId: string,
        data: {
            title: string;
            description?: string;
            tags?: string[];
            categoryId?: string;
            price?: number;
            storeId?: string;
        }
    ) {
        // 1. Normalize
        const rawText = `${data.title} ${data.description || ""} ${(data.tags || []).join(" ")}`;
        const { normalized, language } = NormalizationService.normalize(rawText);
        const expandedText = NormalizationService.expandSynonyms(normalized);

        // 2. Generate Embedding
        const vector = await generateEmbedding(expandedText);

        const docId = generateId();

        // 3. Upsert Document & Embedding
        // Note: Drizzle upsert helper might be cleaner, but transaction is safe
        await db.transaction(async (tx: DbTransaction) => {
            // Check existing
            const [existing] = await tx
                .select()
                .from(searchDocuments)
                .where(and(eq(searchDocuments.entityId, entityId), eq(searchDocuments.entityType, entityType)));

            const finalDocId = existing ? existing.id : docId;

            if (existing) {
                await tx.update(searchDocuments).set({
                    title: data.title,
                    description: normalized,
                    tags: data.tags,
                    categoryId: data.categoryId,
                    price: data.price ? String(data.price) : null,
                    storeId: data.storeId,
                    updatedAt: new Date()
                }).where(eq(searchDocuments.id, finalDocId));
            } else {
                await tx.insert(searchDocuments).values({
                    id: finalDocId,
                    tenantId,
                    entityType,
                    entityId,
                    language,
                    title: data.title,
                    description: normalized,
                    tags: data.tags,
                    categoryId: data.categoryId,
                    price: data.price ? String(data.price) : null,
                    storeId: data.storeId,
                });
            }

            // Update Embedding
            // Delete old
            await tx.delete(searchEmbeddings).where(eq(searchEmbeddings.documentId, finalDocId));
            // Insert new
            await tx.insert(searchEmbeddings).values({
                id: generateId(),
                documentId: finalDocId,
                vector,
                modelVersion: "v1"
            });
        });
    }

    // --- Retrieval ---

    async semanticSearch(query: string, tenantId: string, limit = 20) {
        const { normalized } = NormalizationService.normalize(query);
        const queryVector = await generateEmbedding(normalized);
        const vectorString = `[${queryVector.join(",")}]`;

        // PGVector Cosine Similarity
        // <=> is cosine distance operator
        // 1 - (vec <=> query) = Similarity

        const results = await db
            .select({
                id: searchDocuments.id,
                entityId: searchDocuments.entityId,
                entityType: searchDocuments.entityType,
                title: searchDocuments.title,
                score: sql<number>`1 - (${searchEmbeddings.vector} <=> ${vectorString})`.as("score")
            })
            .from(searchEmbeddings)
            .innerJoin(searchDocuments, eq(searchEmbeddings.documentId, searchDocuments.id))
            .where(eq(searchDocuments.tenantId, tenantId))
            .orderBy(sql`(${searchEmbeddings.vector} <=> ${vectorString})`) // ASC distance = DESC similarity
            .limit(limit);

        return results;
    }

    async getSuggestions(query: string, limit = 10) {
        if (!query || query.trim().length === 0) return [];
        const { normalized } = NormalizationService.normalize(query);
        const results = await db
            .select({
                id: searchDocuments.id,
                entityId: searchDocuments.entityId,
                entityType: searchDocuments.entityType,
                title: searchDocuments.title,
            })
            .from(searchDocuments)
            .where(
                and(
                    eq(searchDocuments.isActive, true),
                    ilike(searchDocuments.title, `%${normalized}%`)
                )
            )
            .limit(limit);
        return results;
    }

    async hybridRerank(
        candidates: { id: string, entityId: string }[], // Top K from SQL
        query: string
    ) {
        if (candidates.length === 0) return [];

        // 1. Get Embeddings for Candidates
        const { normalized } = NormalizationService.normalize(query);
        const queryVector = await generateEmbedding(normalized);
        const vectorString = `[${queryVector.join(",")}]`;

        const candidateIds = candidates.map(c => c.entityId);

        const scored = await db
            .select({
                entityId: searchDocuments.entityId,
                score: sql<number>`1 - (${searchEmbeddings.vector} <=> ${vectorString})`
            })
            .from(searchEmbeddings)
            .innerJoin(searchDocuments, eq(searchEmbeddings.documentId, searchDocuments.id))
            .where(sql`${searchDocuments.entityId} IN ${candidateIds}`)
            .limit(candidates.length);

        // Map back to original objects
        const scoreMap = new Map(scored.map(s => [s.entityId, Number(s.score)]));

        return candidates.map(c => ({
            ...c,
            semanticScore: scoreMap.get(c.entityId) || 0
        })).sort((a, b) => b.semanticScore - a.semanticScore);
    }
}

export const searchService = new SearchService();
