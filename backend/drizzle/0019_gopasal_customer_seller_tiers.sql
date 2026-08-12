--> migrate: tiering & checkout transparency
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "slug" varchar(60);
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "benefits" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pricing_snapshot" jsonb;

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
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "store_marketing_plans_slug_unique" ON "store_marketing_plans" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_store_marketing_plans_active" ON "store_marketing_plans" ("is_active","slug");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "store_marketing_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"status" subscription_status NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"auto_renew" boolean DEFAULT true,
	"payment_token_ref" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "store_marketing_subscriptions" ADD CONSTRAINT "store_marketing_subscriptions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "store_marketing_subscriptions" ADD CONSTRAINT "store_marketing_subscriptions_plan_id_store_marketing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "store_marketing_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_store_mkt_sub_store_status" ON "store_marketing_subscriptions" ("store_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_store_mkt_sub_end" ON "store_marketing_subscriptions" ("end_at");
