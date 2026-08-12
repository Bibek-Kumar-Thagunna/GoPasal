CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"env" varchar(20) DEFAULT 'production' NOT NULL,
	"tenant_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_flag_key_env_tenant" ON "feature_flags" USING btree ("key","env","tenant_id");