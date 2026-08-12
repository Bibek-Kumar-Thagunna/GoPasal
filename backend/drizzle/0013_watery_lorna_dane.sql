CREATE TYPE "public"."verification_step" AS ENUM('PENDING_INFO', 'PENDING_DOCS', 'PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "store_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"required_product_fields" jsonb,
	"order_status_flow" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dynamic_attributes" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "store_category_id" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "is_open" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "is_busy_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "busy_mode_eta_minutes" real;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "kyc_business_name" varchar(255);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "kyc_pan_vat" varchar(50);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "kyc_address" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "kyc_store_license_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "kyc_store_photos" jsonb;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "verification_step" "verification_step" DEFAULT 'PENDING_INFO';--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "verification_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "verification_reviewed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_store_categories_slug" ON "store_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_stores_category" ON "stores" USING btree ("store_category_id");--> statement-breakpoint
CREATE INDEX "idx_stores_verification" ON "stores" USING btree ("verification_step");