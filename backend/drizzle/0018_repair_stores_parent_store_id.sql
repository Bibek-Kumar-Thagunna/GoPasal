-- Repair: some databases recorded 0016 without applying the ALTER (schema drift).
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "parent_store_id" text;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stores" ADD CONSTRAINT "stores_parent_store_id_stores_id_fk" FOREIGN KEY ("parent_store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stores_parent" ON "stores" ("parent_store_id");
