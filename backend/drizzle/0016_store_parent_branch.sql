ALTER TABLE "stores" ADD COLUMN "parent_store_id" text;
ALTER TABLE "stores" ADD CONSTRAINT "stores_parent_store_id_stores_id_fk" FOREIGN KEY ("parent_store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "idx_stores_parent" ON "stores" ("parent_store_id");
