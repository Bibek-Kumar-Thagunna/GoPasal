ALTER TABLE "products" ADD COLUMN "compare_at_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_deliverable" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "shop_type" varchar(50) DEFAULT 'GROCERY' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "delivery_type" varchar(50) DEFAULT 'PLATFORM' NOT NULL;