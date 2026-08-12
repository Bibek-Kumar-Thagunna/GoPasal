import {
    pgTable,
    text,
    timestamp,
    
    boolean,
    
    decimal,
    jsonb,
    index,
    
    vector
} from "drizzle-orm/pg-core";
// Note: 'vector' is available in recent drizzle-orm versions. 
// If specific version doesn't export 'vector', we might need custom type, 
// but assuming environment has compatible version as per plan.

export const searchDocuments = pgTable(
    "search_documents",
    {
        id: text("id").primaryKey(),
        tenantId: text("tenant_id").notNull(),
        entityType: text("entity_type").notNull(), // 'PRODUCT', 'STORE', 'CATEGORY'
        entityId: text("entity_id").notNull(), // FK to actual table
        language: text("language").default("MIXED"), // 'EN', 'NE', 'MIXED'

        // Content for Indexing
        title: text("title").notNull(),
        description: text("description"), // Normalized text
        tags: jsonb("tags").$type<string[]>(), // ["momo", "dumpling", "nepali"]

        // Metadata for Filtering (Denormalized)
        categoryId: text("category_id"),
        price: decimal("price", { precision: 10, scale: 2 }),
        storeId: text("store_id"),
        isActive: boolean("is_active").default(true),

        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_search_docs_entity").on(table.entityId, table.entityType),
        index("idx_search_docs_store").on(table.storeId),
        index("idx_search_docs_tenant").on(table.tenantId),
    ]
);

export const searchEmbeddings = pgTable(
    "search_embeddings",
    {
        id: text("id").primaryKey(),
        documentId: text("document_id")
            .references(() => searchDocuments.id, { onDelete: "cascade" })
            .notNull(),

        // Vector Data
        // 1536 dimensions (OpenAI text-embedding-3-small standard)
        vector: vector("embedding", { dimensions: 1536 }),
        modelVersion: text("model_version").default("v1"),

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_search_emb_doc").on(table.documentId),
        // HNSW cosine index for fast ANN search (requires pgvector >= 0.5).
        index("idx_search_emb_vec")
            .using("hnsw", table.vector.op("vector_cosine_ops")),
    ]
);

export const searchSynonyms = pgTable("search_synonyms", {
    id: text("id").primaryKey(),
    term: text("term").notNull(), // "momo"
    language: text("language").default("EN"),
    expansions: jsonb("expansions").$type<string[]>().notNull(), // ["dumpling", "dim sum"]
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
