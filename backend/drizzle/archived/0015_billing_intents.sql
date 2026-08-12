DO $$ BEGIN
 CREATE TYPE "public"."billing_payer_type" AS ENUM('CUSTOMER', 'STORE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."billing_purpose" AS ENUM('SUBSCRIPTION', 'STORE_MARKETING');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."billing_intent_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "billing_intents" ADD CONSTRAINT "billing_intents_payer_user_id_users_id_fk" FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "billing_intents" ADD CONSTRAINT "billing_intents_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_intents_payer" ON "billing_intents" USING btree ("payer_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_intents_store" ON "billing_intents" USING btree ("store_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_intents_status" ON "billing_intents" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_intents_idem" ON "billing_intents" USING btree ("idempotency_key");
