CREATE TYPE "public"."order_fulfillment_type" AS ENUM('MERCHANT_DELIVERY', 'PICKUP');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfillment_type" "order_fulfillment_type" DEFAULT 'MERCHANT_DELIVERY' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "delivery_address_id" DROP NOT NULL;--> statement-breakpoint
