CREATE TABLE IF NOT EXISTS "store_staff_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"store_staff_id" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "store_staff_roles_staff_role_uq" ON "store_staff_roles" ("store_staff_id","role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_store_staff_roles_staff" ON "store_staff_roles" ("store_staff_id");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "store_staff_roles" ADD CONSTRAINT "store_staff_roles_store_staff_id_store_staff_id_fk" FOREIGN KEY ("store_staff_id") REFERENCES "public"."store_staff"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "store_staff_roles" ("id", "store_staff_id", "role", "created_at")
SELECT replace(gen_random_uuid()::text, '-', ''), ss."id", ss."role", now()
FROM "store_staff" ss
WHERE NOT EXISTS (
  SELECT 1 FROM "store_staff_roles" r WHERE r."store_staff_id" = ss."id" AND r."role" = ss."role"
);
--> statement-breakpoint
ALTER TABLE "store_staff" DROP COLUMN IF EXISTS "role";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "announcement_scope" AS ENUM('SINGLE_STORE', 'ALL_BRANCHES');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seller_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"root_store_id" text NOT NULL,
	"scope" "announcement_scope" NOT NULL,
	"target_store_id" text,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seller_announcements" ADD CONSTRAINT "seller_announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seller_announcements" ADD CONSTRAINT "seller_announcements_root_store_id_stores_id_fk" FOREIGN KEY ("root_store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seller_announcements" ADD CONSTRAINT "seller_announcements_target_store_id_stores_id_fk" FOREIGN KEY ("target_store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_seller_ann_root" ON "seller_announcements" ("root_store_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_seller_ann_target" ON "seller_announcements" ("target_store_id");
