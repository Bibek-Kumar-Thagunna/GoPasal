-- Platform logistics fulfillment + merchant-self as default store delivery mode
ALTER TYPE "public"."order_fulfillment_type" ADD VALUE IF NOT EXISTS 'PLATFORM_LOGISTICS';--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "delivery_type" SET DEFAULT 'MERCHANT_SELF';--> statement-breakpoint
UPDATE "stores" SET "delivery_type" = 'MERCHANT_SELF' WHERE "delivery_type" IN ('SELF', 'MERCHANT');--> statement-breakpoint
