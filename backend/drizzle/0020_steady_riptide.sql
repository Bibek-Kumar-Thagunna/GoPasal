DO $$ BEGIN
  CREATE TYPE "public"."billing_intent_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."billing_payer_type" AS ENUM('CUSTOMER', 'STORE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."billing_purpose" AS ENUM('SUBSCRIPTION', 'STORE_MARKETING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."order_fulfillment_type" AS ENUM('MERCHANT_DELIVERY', 'PICKUP', 'PLATFORM_LOGISTICS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."payment_attempt_status" AS ENUM('INITIATED', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."payment_channel" AS ENUM('COD', 'ESEWA', 'KHALTI', 'FONEPAY_QR', 'CARD', 'WALLET');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."payment_provider_id" AS ENUM('SKYPAY', 'KHALTI_DIRECT', 'ESEWA_DIRECT', 'COD_INTERNAL', 'FONEPAY_DIRECT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."webhook_event_status" AS ENUM('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."announcement_scope" AS ENUM('SINGLE_STORE', 'ALL_BRANCHES');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "billing_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"payer_user_id" text NOT NULL,
	"payer_type" "billing_payer_type" NOT NULL,
	"store_id" text,
	"purpose" "billing_purpose" NOT NULL,
	"reference_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"channel" text,
	"status" "billing_intent_status" DEFAULT 'PENDING' NOT NULL,
	"provider" text,
	"provider_ref" text,
	"idempotency_key" text,
	"metadata" jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
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
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_type" varchar(32) NOT NULL,
	"actor_id" text,
	"action" varchar(64) NOT NULL,
	"order_id" text,
	"payment_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
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
);--> statement-breakpoint
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
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_staff_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"store_staff_id" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seller_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"root_store_id" text NOT NULL,
	"scope" "announcement_scope" NOT NULL,
	"target_store_id" text,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_marketing_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(60) NOT NULL,
	"description" text,
	"monthly_price" numeric(12, 2) NOT NULL,
	"benefits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_marketing_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"auto_renew" boolean DEFAULT true,
	"payment_token_ref" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "delivery_type" SET DEFAULT 'MERCHANT_SELF';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "delivery_address_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "search_embeddings" ALTER COLUMN "embedding" SET DATA TYPE jsonb USING ("embedding"::text)::jsonb;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "contact_name" varchar(255);--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "building_name" varchar(255);--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "floor" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "push_token" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "parent_store_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_type" "order_fulfillment_type" DEFAULT 'MERCHANT_DELIVERY' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "commission_rate_snapshot" real DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pricing_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "slug" varchar(60);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "benefits" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "billing_intents" ADD CONSTRAINT "billing_intents_payer_user_id_users_id_fk" FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "billing_intents" ADD CONSTRAINT "billing_intents_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "seller_payout_requests" ADD CONSTRAINT "seller_payout_requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "store_staff_roles" ADD CONSTRAINT "store_staff_roles_store_staff_id_store_staff_id_fk" FOREIGN KEY ("store_staff_id") REFERENCES "public"."store_staff"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "seller_announcements" ADD CONSTRAINT "seller_announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "seller_announcements" ADD CONSTRAINT "seller_announcements_root_store_id_stores_id_fk" FOREIGN KEY ("root_store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "seller_announcements" ADD CONSTRAINT "seller_announcements_target_store_id_stores_id_fk" FOREIGN KEY ("target_store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "store_marketing_subscriptions" ADD CONSTRAINT "store_marketing_subscriptions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "store_marketing_subscriptions" ADD CONSTRAINT "store_marketing_subscriptions_plan_id_store_marketing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."store_marketing_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_intents_payer" ON "billing_intents" USING btree ("payer_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_intents_store" ON "billing_intents" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_intents_status" ON "billing_intents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_intents_idem" ON "billing_intents" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_attempts_order" ON "payment_attempts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_attempts_payment" ON "payment_attempts" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_attempts_status" ON "payment_attempts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_payment_attempts_idem" ON "payment_attempts" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_audit_order" ON "payment_audit_logs" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_audit_action" ON "payment_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payout_requests_store" ON "seller_payout_requests" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payout_requests_status" ON "seller_payout_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_webhook_provider_event" ON "webhook_events" USING btree ("provider","external_event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_events_status" ON "webhook_events" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "store_staff_roles_staff_role_uq" ON "store_staff_roles" USING btree ("store_staff_id","role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_store_staff_roles_staff" ON "store_staff_roles" USING btree ("store_staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_seller_ann_root" ON "seller_announcements" USING btree ("root_store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_seller_ann_target" ON "seller_announcements" USING btree ("target_store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_store_marketing_plans_active" ON "store_marketing_plans" USING btree ("is_active","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_store_mkt_sub_store_status" ON "store_marketing_subscriptions" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_store_mkt_sub_end" ON "store_marketing_subscriptions" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stores_parent" ON "stores" USING btree ("parent_store_id");--> statement-breakpoint
ALTER TABLE "store_staff" DROP COLUMN IF EXISTS "role";
