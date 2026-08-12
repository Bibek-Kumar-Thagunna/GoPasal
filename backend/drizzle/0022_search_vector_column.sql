CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "search_embeddings" ALTER COLUMN "embedding" SET DATA TYPE vector(1536) USING ("embedding"::text)::vector;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_search_emb_vec" ON "search_embeddings" USING hnsw ("embedding" vector_cosine_ops);
