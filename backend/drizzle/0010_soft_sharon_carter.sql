CREATE TYPE "public"."campaign_status" AS ENUM('ACTIVE', 'PAUSED', 'ENDED');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('SPONSORED_LISTING', 'BANNER');--> statement-breakpoint
CREATE TYPE "public"."pacing_mode" AS ENUM('STANDARD', 'ACCELERATED');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('KEYWORD', 'CATEGORY', 'PRODUCT');--> statement-breakpoint
CREATE TYPE "public"."metric_type" AS ENUM('SALES', 'RETENTION', 'INVENTORY');--> statement-breakpoint
CREATE TYPE "public"."auth_event_type" AS ENUM('LOGIN', 'LINK', 'UNLINK', 'biometric_challenge', 'biometric_verify', 'silent_verify');--> statement-breakpoint
CREATE TYPE "public"."identity_provider" AS ENUM('GOOGLE', 'APPLE', 'FACEBOOK', 'PHONE', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."split_status" AS ENUM('PENDING', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."coupon_type" AS ENUM('FIXED', 'PERCENT');--> statement-breakpoint
CREATE TYPE "public"."dispute_type" AS ENUM('WRONG_ITEM', 'MISSING_ITEM', 'DAMAGED', 'LATE_DELIVERY', 'COD_DISPUTE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."rider_tier" AS ENUM('BRONZE', 'SILVER', 'GOLD', 'DIAMOND');--> statement-breakpoint
CREATE TYPE "public"."flash_sale_status" AS ENUM('SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."hot_item_status" AS ENUM('ACTIVE', 'DISABLED', 'SOLD_OUT');--> statement-breakpoint
CREATE TYPE "public"."badge_type" AS ENUM('FASTEST_PACKER', 'TOP_RATED', 'RELIABLE_STOCK', 'CUSTOMER_FAVORITE');--> statement-breakpoint
CREATE TYPE "public"."badge_window" AS ENUM('WEEKLY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('HOST', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."participant_status" AS ENUM('ACTIVE', 'LEFT', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."coupon_status" AS ENUM('ACTIVE', 'PAUSED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."loyalty_type" AS ENUM('EARN', 'REDEEM', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('PENDING', 'COMPLETED', 'REWARDED', 'INVALID');--> statement-breakpoint
CREATE TYPE "public"."escrow_status" AS ENUM('HELD', 'RELEASED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('COD', 'ESEWA', 'KHALTI');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."refund_type" AS ENUM('FULL', 'PARTIAL', 'STORE_CREDIT');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."cart_status" AS ENUM('OPEN', 'LOCKED', 'COMPLETED', 'ABANDONED');--> statement-breakpoint
CREATE TYPE "public"."cart_type" AS ENUM('SINGLE', 'GROUP');--> statement-breakpoint
CREATE TYPE "public"."collection_status" AS ENUM('NOT_REQUIRED', 'PENDING', 'COLLECTED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."splitting_strategy" AS ENUM('NONE', 'EQUAL', 'ITEMIZED');--> statement-breakpoint
CREATE TYPE "public"."deposit_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."pos_integration_status" AS ENUM('ACTIVE', 'PAUSED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."pos_provider" AS ENUM('IMS', 'SQUARE', 'CLOVER', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."pos_sync_status" AS ENUM('PENDING', 'SYNCED', 'FAILED', 'RETRYING');--> statement-breakpoint
CREATE TYPE "public"."pos_sync_type" AS ENUM('MENU_PULL', 'ORDER_PUSH', 'INVENTORY_PUSH');--> statement-breakpoint
CREATE TYPE "public"."invoice_line_type" AS ENUM('GOODS', 'PLATFORM_SERVICE', 'DELIVERY_SERVICE', 'DISCOUNT');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('INVOICE', 'CREDIT_NOTE');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('MANAGER', 'CASHIER', 'PACKER', 'DRIVER');--> statement-breakpoint
CREATE TYPE "public"."staff_status" AS ENUM('INVITED', 'ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."subscription_event_type" AS ENUM('CREATED', 'RENEWED', 'CANCELLED', 'FAILED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAYMENT_FAILED');--> statement-breakpoint
CREATE TYPE "public"."rec_type" AS ENUM('ALSO_BOUGHT', 'SIMILAR', 'COMPLEMENTARY');--> statement-breakpoint
CREATE TYPE "public"."trend_period" AS ENUM('DAILY', 'WEEKLY');--> statement-breakpoint
CREATE TYPE "public"."support_action_status" AS ENUM('REQUESTED', 'APPROVED', 'EXECUTED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."support_action_type" AS ENUM('FETCH_ORDER_STATUS', 'ISSUE_WALLET_CREDIT', 'CREATE_TICKET', 'ESCALATE');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('BOT_ACTIVE', 'HUMAN_PENDING', 'HUMAN_ACTIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."message_sender" AS ENUM('USER', 'BOT', 'AGENT');--> statement-breakpoint
ALTER TYPE "public"."delivery_task_status" ADD VALUE 'RETURN_INITIATED';--> statement-breakpoint
ALTER TYPE "public"."delivery_task_status" ADD VALUE 'RETURNED_TO_SELLER';--> statement-breakpoint
CREATE TABLE "ad_impressions" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"store_id" text NOT NULL,
	"target_id" text,
	"user_id" text,
	"cost" numeric(10, 4) NOT NULL,
	"placement" varchar(50) DEFAULT 'SEARCH_LISTING',
	"served_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_spend_daily" (
	"date" varchar(10) NOT NULL,
	"campaign_id" text NOT NULL,
	"store_id" text NOT NULL,
	"total_spend" numeric(10, 4) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_spend_daily_date_campaign_id_pk" PRIMARY KEY("date","campaign_id")
);
--> statement-breakpoint
CREATE TABLE "sponsored_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "campaign_type" DEFAULT 'SPONSORED_LISTING' NOT NULL,
	"status" "campaign_status" DEFAULT 'ACTIVE' NOT NULL,
	"daily_budget" numeric(10, 2) NOT NULL,
	"pacing_mode" "pacing_mode" DEFAULT 'STANDARD',
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsored_targets" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"target_type" "target_type" NOT NULL,
	"target_value" varchar(255) NOT NULL,
	"bid_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"type" "metric_type" DEFAULT 'SALES' NOT NULL,
	"metric" text NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"dimensions" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unq_metric_date_dim" UNIQUE("date","metric","dimensions")
);
--> statement-breakpoint
CREATE TABLE "auth_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"event_type" "auth_event_type" NOT NULL,
	"metadata" jsonb,
	"ip_address" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"device_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"transports" jsonb,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_identities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "identity_provider" NOT NULL,
	"provider_id" text NOT NULL,
	"email" varchar(255),
	"metadata" jsonb,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_order_splits" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text NOT NULL,
	"amount_owed" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" "split_status" DEFAULT 'PENDING' NOT NULL,
	"transaction_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"code" varchar(20) NOT NULL,
	"type" "coupon_type" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"min_order_value" numeric(10, 2) DEFAULT '0',
	"max_discount" numeric(10, 2),
	"requires_gold" boolean DEFAULT false,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"usage_limit_total" integer,
	"usage_limit_per_user" integer DEFAULT 1,
	"used_count" integer DEFAULT 0,
	"status" "coupon_status" DEFAULT 'ACTIVE',
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_points" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"lifetime_points" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referee_id" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"reward_amount" numeric(10, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'PENDING',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"dispute_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"sender_role" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"attachments" jsonb,
	"is_internal" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch_product_links" (
	"branch_store_id" text NOT NULL,
	"template_id" text NOT NULL,
	"product_id" text NOT NULL,
	"price_override" numeric(10, 2),
	"is_local_override" boolean DEFAULT false NOT NULL,
	"is_synced" boolean DEFAULT true,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_merchants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_id" text NOT NULL,
	"branch_ids" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_product_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"master_merchant_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"base_price" numeric(10, 2) NOT NULL,
	"category_id" text NOT NULL,
	"images" jsonb,
	"zone_rates" jsonb,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rider_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"rider_id" text NOT NULL,
	"tier" "rider_tier" DEFAULT 'BRONZE' NOT NULL,
	"monthly_orders" integer DEFAULT 0,
	"rating" integer DEFAULT 500,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rider_tiers_rider_id_unique" UNIQUE("rider_id")
);
--> statement-breakpoint
CREATE TABLE "flash_sale_events" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" "flash_sale_status" DEFAULT 'SCHEDULED' NOT NULL,
	"max_rps" integer DEFAULT 100 NOT NULL,
	"strict_rate_limit_profile_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hot_item_config" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"initial_stock" integer NOT NULL,
	"shard_count" integer DEFAULT 16 NOT NULL,
	"reserved_stock" integer DEFAULT 0 NOT NULL,
	"oversell_buffer" integer DEFAULT 0 NOT NULL,
	"status" "hot_item_status" DEFAULT 'ACTIVE' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rider_leaderboards" (
	"id" text PRIMARY KEY NOT NULL,
	"rider_id" text NOT NULL,
	"year_month" varchar(7) NOT NULL,
	"score" numeric(10, 2) NOT NULL,
	"rank" integer NOT NULL,
	"city" varchar(100),
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rider_performance_monthly" (
	"id" text PRIMARY KEY NOT NULL,
	"rider_id" text NOT NULL,
	"year_month" varchar(7) NOT NULL,
	"completed_orders" integer DEFAULT 0 NOT NULL,
	"acceptance_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"cancellation_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"avg_rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"on_time_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"safety_flags" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_badges" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"badge_type" "badge_type" NOT NULL,
	"window" "badge_window" DEFAULT 'WEEKLY' NOT NULL,
	"score_snapshot" numeric(10, 2),
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cart_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "participant_role" DEFAULT 'MEMBER' NOT NULL,
	"status" "participant_status" DEFAULT 'ACTIVE' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" "loyalty_type" NOT NULL,
	"order_id" text,
	"balance_after" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"user_id" text PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referee_id" text NOT NULL,
	"status" "referral_status" DEFAULT 'PENDING',
	"reward_amount" numeric(10, 2) NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cod_records" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_task_id" text NOT NULL,
	"order_id" text NOT NULL,
	"rider_id" text NOT NULL,
	"expected_amount" numeric(10, 2) NOT NULL,
	"collected_amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"is_reconciled" boolean DEFAULT false,
	"reconciled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrow" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text,
	"order_id" text NOT NULL,
	"tenant_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"status" "escrow_status" DEFAULT 'HELD' NOT NULL,
	"ledger_journal_id" text,
	"settlement_id" text,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"balance" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"journal_id" text NOT NULL,
	"account_id" text NOT NULL,
	"ref_type" varchar(50) NOT NULL,
	"ref_id" text NOT NULL,
	"description" text,
	"type" varchar(10) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_records" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"method" "payment_method_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"gateway_ref" text,
	"idempotency_key" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"payment_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"type" "refund_type" DEFAULT 'FULL' NOT NULL,
	"status" "refund_status" DEFAULT 'PENDING' NOT NULL,
	"reason" text,
	"processed_at" timestamp with time zone,
	"ledger_journal_id" text,
	"escrow_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlement_items" (
	"id" text PRIMARY KEY NOT NULL,
	"settlement_id" text NOT NULL,
	"escrow_id" text NOT NULL,
	"order_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"fee" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"gross_amount" numeric(10, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"delivery_fees" numeric(10, 2) DEFAULT '0',
	"refund_adjustments" numeric(10, 2) DEFAULT '0',
	"net_amount" numeric(10, 2) NOT NULL,
	"status" "settlement_status" DEFAULT 'PENDING' NOT NULL,
	"transaction_ref" text,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_violations" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"policy_type" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"resource" varchar(50),
	"resource_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictive_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"rider_id" text NOT NULL,
	"message" text NOT NULL,
	"target_location" jsonb,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rider_deposits" (
	"id" text PRIMARY KEY NOT NULL,
	"rider_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "deposit_status" DEFAULT 'PENDING' NOT NULL,
	"reference_code" varchar(50),
	"proof_url" text,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"rider_id" text,
	"status" "trip_status" DEFAULT 'PLANNED' NOT NULL,
	"route_plan" jsonb,
	"total_distance" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"provider" "pos_provider" NOT NULL,
	"config" text NOT NULL,
	"status" "pos_integration_status" DEFAULT 'ACTIVE' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_order_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"external_order_id" varchar(255),
	"sync_status" "pos_sync_status" DEFAULT 'PENDING' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_product_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"external_product_id" varchar(255) NOT NULL,
	"external_variant_id" varchar(255),
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_sync_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"type" "pos_sync_type" NOT NULL,
	"status" "pos_sync_status" NOT NULL,
	"payload" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"type" "invoice_line_type" NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"net_amount" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"gross_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"store_id" text NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"type" "invoice_type" DEFAULT 'INVOICE' NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"issue_date" timestamp with time zone,
	"currency" varchar(3) DEFAULT 'NPR' NOT NULL,
	"buyer_details" jsonb,
	"totals" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text,
	"legal_name" varchar(255) NOT NULL,
	"vat_number" varchar(50),
	"address" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_vat_registered" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text NOT NULL,
	"store_id" text NOT NULL,
	"product_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_verified_purchase" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_staff" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "staff_role" DEFAULT 'MANAGER' NOT NULL,
	"status" "staff_status" DEFAULT 'INVITED' NOT NULL,
	"invited_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" text PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"version" varchar(20) NOT NULL,
	"effective_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"policy_id" text NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "search_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"language" text DEFAULT 'MIXED',
	"title" text NOT NULL,
	"description" text,
	"tags" jsonb,
	"category_id" text,
	"price" numeric(10, 2),
	"store_id" text,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"embedding" vector(1536),
	"model_version" text DEFAULT 'v1',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_synonyms" (
	"id" text PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"language" text DEFAULT 'EN',
	"expansions" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_subscription_id" text NOT NULL,
	"type" "subscription_event_type" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"duration_days" integer NOT NULL,
	"delivery_free_threshold" numeric(10, 2),
	"is_priority_delivery" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"auto_renew" boolean DEFAULT true,
	"payment_token_ref" text,
	"last_renewal_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"source_product_id" text NOT NULL,
	"target_product_id" text NOT NULL,
	"score" numeric(5, 4) NOT NULL,
	"type" "rec_type" DEFAULT 'ALSO_BOUGHT' NOT NULL,
	"algorithm_version" text DEFAULT 'v1',
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unq_rec_pair_type" UNIQUE("source_product_id","target_product_id","type")
);
--> statement-breakpoint
CREATE TABLE "trending_products" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"score" numeric(10, 2) NOT NULL,
	"period" "trend_period" DEFAULT 'WEEKLY' NOT NULL,
	"rank" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unq_trend_product_period" UNIQUE("product_id","period")
);
--> statement-breakpoint
CREATE TABLE "support_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"action_type" "support_action_type" NOT NULL,
	"status" "support_action_status" DEFAULT 'REQUESTED' NOT NULL,
	"payload" jsonb,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text,
	"channel" varchar(50) DEFAULT 'IN_APP' NOT NULL,
	"status" "conversation_status" DEFAULT 'BOT_ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender" "message_sender" NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delivery_tasks" DROP CONSTRAINT "delivery_tasks_order_id_unique";--> statement-breakpoint
ALTER TABLE "delivery_tasks" DROP CONSTRAINT "delivery_tasks_order_id_orders_id_fk";
--> statement-breakpoint
DROP INDEX "idx_tasks_status";--> statement-breakpoint
DROP INDEX "idx_tasks_rider";--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "trip_task_id" text;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "picked_up_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "cod_collected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "cod_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "cod_collected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "delivery_fee" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "platform_fee" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "rider_earnings" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD COLUMN "failure_reason" text;--> statement-breakpoint
ALTER TABLE "riders" ADD COLUMN "total_earnings" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "riders" ADD COLUMN "pending_settlement" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "riders" ADD COLUMN "wallet_balance" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "riders" ADD COLUMN "tier" varchar(20) DEFAULT 'BRONZE';--> statement-breakpoint
ALTER TABLE "riders" ADD COLUMN "earnings" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "riders" ADD COLUMN "is_ev" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "riders" ADD COLUMN "cod_cash_in_hand" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "riders" ADD COLUMN "max_wallet_limit" numeric(10, 2) DEFAULT '5000';--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN "type" "dispute_type" DEFAULT 'OTHER' NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN "priority" varchar(20) DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN "evidence_urls" jsonb;--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN "resolution" jsonb;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD COLUMN "rules" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD COLUMN "client_side" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_language" varchar(10) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "data_export_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "operating_hours" jsonb;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "kyc_document_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "kyc_status" varchar(50) DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "master_merchant_id" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "branch_zone" varchar(50);--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "added_by" text;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "type" "cart_type" DEFAULT 'SINGLE' NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "status" "cart_status" DEFAULT 'OPEN' NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "share_code" varchar(20);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "splitting_strategy" "splitting_strategy" DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_collection_status" "collection_status" DEFAULT 'NOT_REQUIRED' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_priority_delivery" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_green_delivery" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "device_credentials" ADD CONSTRAINT "device_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_order_splits" ADD CONSTRAINT "group_order_splits_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_order_splits" ADD CONSTRAINT "group_order_splits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_product_links" ADD CONSTRAINT "branch_product_links_template_id_master_product_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."master_product_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_merchants" ADD CONSTRAINT "master_merchants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_templates" ADD CONSTRAINT "master_product_templates_master_merchant_id_master_merchants_id_fk" FOREIGN KEY ("master_merchant_id") REFERENCES "public"."master_merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_tiers" ADD CONSTRAINT "rider_tiers_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hot_item_config" ADD CONSTRAINT "hot_item_config_event_id_flash_sale_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."flash_sale_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hot_item_config" ADD CONSTRAINT "hot_item_config_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_leaderboards" ADD CONSTRAINT "rider_leaderboards_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_performance_monthly" ADD CONSTRAINT "rider_performance_monthly_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_badges" ADD CONSTRAINT "seller_badges_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_participants" ADD CONSTRAINT "cart_participants_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_participants" ADD CONSTRAINT "cart_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow" ADD CONSTRAINT "escrow_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow" ADD CONSTRAINT "escrow_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow" ADD CONSTRAINT "escrow_tenant_id_stores_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."ledger_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_settlement_id_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_escrow_id_escrow_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_alerts" ADD CONSTRAINT "predictive_alerts_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_deposits" ADD CONSTRAINT "rider_deposits_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_tasks" ADD CONSTRAINT "trip_tasks_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_integrations" ADD CONSTRAINT "pos_integrations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_order_mappings" ADD CONSTRAINT "pos_order_mappings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_product_mappings" ADD CONSTRAINT "pos_product_mappings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_product_mappings" ADD CONSTRAINT "pos_product_mappings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_product_mappings" ADD CONSTRAINT "pos_product_mappings_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sync_logs" ADD CONSTRAINT "pos_sync_logs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_profiles" ADD CONSTRAINT "tax_profiles_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_staff" ADD CONSTRAINT "store_staff_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_staff" ADD CONSTRAINT "store_staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_staff" ADD CONSTRAINT "store_staff_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_embeddings" ADD CONSTRAINT "search_embeddings_document_id_search_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."search_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_user_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("user_subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_source_product_id_products_id_fk" FOREIGN KEY ("source_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_target_product_id_products_id_fk" FOREIGN KEY ("target_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trending_products" ADD CONSTRAINT "trending_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_actions" ADD CONSTRAINT "support_actions_conversation_id_support_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."support_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_conversation_id_support_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."support_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_impr_campaign" ON "ad_impressions" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_impr_time" ON "ad_impressions" USING btree ("served_at");--> statement-breakpoint
CREATE INDEX "idx_spend_campaign" ON "ad_spend_daily" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_store" ON "sponsored_campaigns" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_status" ON "sponsored_campaigns" USING btree ("status","start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_target_lookup" ON "sponsored_targets" USING btree ("target_type","target_value");--> statement-breakpoint
CREATE INDEX "idx_target_campaign" ON "sponsored_targets" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_date" ON "analytics_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_analytics_metric" ON "analytics_metrics" USING btree ("metric");--> statement-breakpoint
CREATE INDEX "idx_device_creds_user" ON "device_credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_identities_user" ON "user_identities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_identities_provider" ON "user_identities" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE INDEX "idx_splits_order" ON "group_order_splits" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_splits_user" ON "group_order_splits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_coupon_code_store" ON "coupons" USING btree ("code","store_id");--> statement-breakpoint
CREATE INDEX "idx_coupon_validity" ON "coupons" USING btree ("start_date","end_date","status");--> statement-breakpoint
CREATE INDEX "idx_loyalty_user" ON "loyalty_points" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_referrals_referrer" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_messages_dispute" ON "dispute_messages" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_messages_sender" ON "dispute_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_links_branch" ON "branch_product_links" USING btree ("branch_store_id");--> statement-breakpoint
CREATE INDEX "idx_links_template" ON "branch_product_links" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_master_owner" ON "master_merchants" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_templates_master" ON "master_product_templates" USING btree ("master_merchant_id");--> statement-breakpoint
CREATE INDEX "idx_rider_tiers_rider" ON "rider_tiers" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "idx_fs_status" ON "flash_sale_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fs_time" ON "flash_sale_events" USING btree ("start_at","end_at");--> statement-breakpoint
CREATE INDEX "idx_hot_event" ON "hot_item_config" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_hot_variant" ON "hot_item_config" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_leaderboard_month" ON "rider_leaderboards" USING btree ("year_month");--> statement-breakpoint
CREATE INDEX "idx_leaderboard_rank" ON "rider_leaderboards" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "idx_perf_rider" ON "rider_performance_monthly" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "idx_perf_month" ON "rider_performance_monthly" USING btree ("year_month");--> statement-breakpoint
CREATE INDEX "idx_badges_store" ON "seller_badges" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_badges_type" ON "seller_badges" USING btree ("badge_type");--> statement-breakpoint
CREATE INDEX "idx_cp_cart" ON "cart_participants" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "idx_cp_user" ON "cart_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_redemption_user" ON "coupon_redemptions" USING btree ("user_id","coupon_id");--> statement-breakpoint
CREATE INDEX "idx_redemption_order" ON "coupon_redemptions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_loyalty_ledger_user" ON "loyalty_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_loyalty_order" ON "loyalty_ledger" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_referral_referrer" ON "referral_rewards" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "idx_referral_referee" ON "referral_rewards" USING btree ("referee_id");--> statement-breakpoint
CREATE INDEX "idx_cod_rider" ON "cod_records" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "idx_cod_task" ON "cod_records" USING btree ("delivery_task_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_payment" ON "escrow" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_order" ON "escrow" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_tenant" ON "escrow" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_settlement" ON "escrow" USING btree ("settlement_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_accounts_tenant" ON "ledger_accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_accounts_name" ON "ledger_accounts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_ledger_ref" ON "ledger_entries" USING btree ("ref_type","ref_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_account" ON "ledger_entries" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_journal" ON "ledger_entries" USING btree ("journal_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_idem" ON "ledger_entries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_payments_order" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_idem" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_refunds_order" ON "refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_refunds_status" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_settlement_items_cycle" ON "settlement_items" USING btree ("settlement_id");--> statement-breakpoint
CREATE INDEX "idx_settlements_store" ON "settlements" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_settlements_status" ON "settlements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_policy_actor" ON "policy_violations" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_policy_type" ON "policy_violations" USING btree ("policy_type");--> statement-breakpoint
CREATE INDEX "idx_policy_created" ON "policy_violations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_alert_rider" ON "predictive_alerts" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "idx_deposit_rider" ON "rider_deposits" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "idx_deposit_status" ON "rider_deposits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_trip_rider" ON "trip_tasks" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "idx_trip_status" ON "trip_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pos_integrations_store" ON "pos_integrations" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_pos_order_map_order" ON "pos_order_mappings" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_pos_order_map_external" ON "pos_order_mappings" USING btree ("external_order_id");--> statement-breakpoint
CREATE INDEX "idx_pos_map_store" ON "pos_product_mappings" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_pos_map_product" ON "pos_product_mappings" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_pos_map_external" ON "pos_product_mappings" USING btree ("external_product_id");--> statement-breakpoint
CREATE INDEX "idx_pos_logs_store" ON "pos_sync_logs" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_pos_logs_date" ON "pos_sync_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_invoice_lines_invoice" ON "invoice_lines" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_order" ON "invoices" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_store" ON "invoices" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_number" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tax_profiles_store" ON "tax_profiles" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_product" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_store" ON "reviews" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_wishlists_user" ON "wishlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_staff_store" ON "store_staff" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_staff_user" ON "store_staff" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_policies_category" ON "policies" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_policies_active" ON "policies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_consents_user" ON "user_consents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_consents_policy" ON "user_consents" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "idx_search_docs_entity" ON "search_documents" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "idx_search_docs_store" ON "search_documents" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_search_docs_tenant" ON "search_documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_search_emb_doc" ON "search_embeddings" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_subs_user_status" ON "user_subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_subs_expiry" ON "user_subscriptions" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX "idx_rec_source" ON "product_recommendations" USING btree ("source_product_id");--> statement-breakpoint
CREATE INDEX "idx_trend_period" ON "trending_products" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_trend_rank" ON "trending_products" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "idx_support_conv_user" ON "support_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_support_conv_status" ON "support_conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_support_msg_conv" ON "support_messages" USING btree ("conversation_id");--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD CONSTRAINT "delivery_tasks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_delivery_order" ON "delivery_tasks" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_rider" ON "delivery_tasks" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_status" ON "delivery_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_disputes_reporter" ON "disputes" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "idx_stores_master" ON "stores" USING btree ("master_merchant_id");--> statement-breakpoint
CREATE INDEX "idx_carts_share" ON "carts" USING btree ("share_code");--> statement-breakpoint
ALTER TABLE "disputes" DROP COLUMN "resolution_notes";--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_share_code_unique" UNIQUE("share_code");--> statement-breakpoint
ALTER TABLE "public"."order_status_history" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."order_status_history" ALTER COLUMN "status" SET DATA TYPE text USING ("status"::text);--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DATA TYPE text USING ("status"::text);--> statement-breakpoint
DROP TYPE IF EXISTS "public"."order_status" CASCADE;--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');--> statement-breakpoint
ALTER TABLE "public"."order_status_history" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DEFAULT 'PLACED'::"public"."order_status";