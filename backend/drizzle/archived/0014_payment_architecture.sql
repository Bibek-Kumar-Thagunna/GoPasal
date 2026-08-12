DO $$ BEGIN
 CREATE TYPE "public"."payment_provider_id" AS ENUM('SKYPAY', 'KHALTI_DIRECT', 'ESEWA_DIRECT', 'COD_INTERNAL', 'FONEPAY_DIRECT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_channel" AS ENUM('COD', 'ESEWA', 'KHALTI', 'FONEPAY_QR', 'CARD', 'WALLET');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_attempt_status" AS ENUM('INITIATED', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."webhook_event_status" AS ENUM('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"order_id" text NOT NULL,
	"provider" "payment_provider_id" NOT NULL,
	"channel" "payment_channel" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "payment_attempt_status" DEFAULT 'INITIATED' NOT NULL,
	"provider_ref" text,
	"idempotency_key" text NOT NULL,
	"return_url" text,
	"metadata" jsonb,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" "payment_provider_id" NOT NULL,
	"external_event_id" text NOT NULL,
	"payment_id" text,
	"order_id" text,
	"payload" jsonb NOT NULL,
	"signature" text,
	"status" "webhook_event_status" DEFAULT 'RECEIVED' NOT NULL,
	"error_message" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seller_payout_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"bank_account_ref" text,
	"settlement_id" text,
	"requested_by" text,
	"approved_by" text,
	"rejected_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_type" varchar(32) NOT NULL,
	"actor_id" text,
	"action" varchar(64) NOT NULL,
	"order_id" text,
	"payment_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_payment_attempts_idem" ON "payment_attempts" USING btree ("idempotency_key");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_webhook_provider_event" ON "webhook_events" USING btree ("provider","external_event_id");
--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "seller_payout_requests" ADD CONSTRAINT "seller_payout_requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
