ALTER TYPE "public"."order_status" ADD VALUE 'ACCEPTED' BEFORE 'CONFIRMED';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'OUT_FOR_DELIVERY' BEFORE 'DELIVERED';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'RETURN_INITIATED' BEFORE 'RETURNED';--> statement-breakpoint
ALTER TABLE "loyalty_points" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "referrals" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "loyalty_points" CASCADE;--> statement-breakpoint
DROP TABLE "referrals" CASCADE;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "pod_image_url" text;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "pod_notes" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "owner_reply" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "owner_replied_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "is_moderated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "moderator_note" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "moderated_by" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "moderated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reviews_user" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_order" ON "reviews" USING btree ("order_id");