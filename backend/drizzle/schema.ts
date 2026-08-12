import { pgTable, index, text, varchar, jsonb, timestamp, foreignKey, boolean, numeric, uniqueIndex, unique, integer, real, date, vector, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const announcementScope = pgEnum("announcement_scope", ['SINGLE_STORE', 'ALL_BRANCHES'])
export const authEventType = pgEnum("auth_event_type", ['LOGIN', 'LINK', 'UNLINK', 'biometric_challenge', 'biometric_verify', 'silent_verify'])
export const badgeType = pgEnum("badge_type", ['FASTEST_PACKER', 'TOP_RATED', 'RELIABLE_STOCK', 'CUSTOMER_FAVORITE'])
export const badgeWindow = pgEnum("badge_window", ['WEEKLY', 'MONTHLY'])
export const billingIntentStatus = pgEnum("billing_intent_status", ['PENDING', 'PAID', 'FAILED', 'CANCELLED'])
export const billingPayerType = pgEnum("billing_payer_type", ['CUSTOMER', 'STORE'])
export const billingPurpose = pgEnum("billing_purpose", ['SUBSCRIPTION', 'STORE_MARKETING'])
export const campaignStatus = pgEnum("campaign_status", ['ACTIVE', 'PAUSED', 'ENDED'])
export const campaignType = pgEnum("campaign_type", ['SPONSORED_LISTING', 'BANNER'])
export const cartStatus = pgEnum("cart_status", ['OPEN', 'LOCKED', 'COMPLETED', 'ABANDONED'])
export const cartType = pgEnum("cart_type", ['SINGLE', 'GROUP'])
export const collectionStatus = pgEnum("collection_status", ['NOT_REQUIRED', 'PENDING', 'COLLECTED', 'FAILED'])
export const conversationStatus = pgEnum("conversation_status", ['BOT_ACTIVE', 'HUMAN_PENDING', 'HUMAN_ACTIVE', 'CLOSED'])
export const couponStatus = pgEnum("coupon_status", ['ACTIVE', 'PAUSED', 'EXPIRED'])
export const couponType = pgEnum("coupon_type", ['FIXED', 'PERCENT'])
export const deliveryTaskStatus = pgEnum("delivery_task_status", ['PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED', 'CANCELLED', 'RETURN_INITIATED', 'RETURNED_TO_SELLER'])
export const depositStatus = pgEnum("deposit_status", ['PENDING', 'VERIFIED', 'REJECTED'])
export const disputeStatus = pgEnum("dispute_status", ['OPEN', 'RESOLVED', 'REJECTED'])
export const disputeType = pgEnum("dispute_type", ['WRONG_ITEM', 'MISSING_ITEM', 'DAMAGED', 'LATE_DELIVERY', 'COD_DISPUTE', 'OTHER'])
export const escrowStatus = pgEnum("escrow_status", ['HELD', 'RELEASED', 'REFUNDED'])
export const flashSaleStatus = pgEnum("flash_sale_status", ['SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED'])
export const hotItemStatus = pgEnum("hot_item_status", ['ACTIVE', 'DISABLED', 'SOLD_OUT'])
export const identityProvider = pgEnum("identity_provider", ['GOOGLE', 'APPLE', 'FACEBOOK', 'PHONE', 'EMAIL'])
export const invoiceLineType = pgEnum("invoice_line_type", ['GOODS', 'PLATFORM_SERVICE', 'DELIVERY_SERVICE', 'DISCOUNT'])
export const invoiceStatus = pgEnum("invoice_status", ['DRAFT', 'ISSUED', 'VOID'])
export const invoiceType = pgEnum("invoice_type", ['INVOICE', 'CREDIT_NOTE'])
export const loyaltyType = pgEnum("loyalty_type", ['EARN', 'REDEEM', 'ADJUSTMENT'])
export const messageSender = pgEnum("message_sender", ['USER', 'BOT', 'AGENT'])
export const metricType = pgEnum("metric_type", ['SALES', 'RETENTION', 'INVENTORY'])
export const orderFulfillmentType = pgEnum("order_fulfillment_type", ['MERCHANT_DELIVERY', 'PICKUP', 'PLATFORM_LOGISTICS'])
export const orderStatus = pgEnum("order_status", ['PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_INITIATED', 'RETURNED'])
export const pacingMode = pgEnum("pacing_mode", ['STANDARD', 'ACCELERATED'])
export const participantRole = pgEnum("participant_role", ['HOST', 'MEMBER'])
export const participantStatus = pgEnum("participant_status", ['ACTIVE', 'LEFT', 'REMOVED'])
export const paymentAttemptStatus = pgEnum("payment_attempt_status", ['INITIATED', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED'])
export const paymentChannel = pgEnum("payment_channel", ['COD', 'ESEWA', 'KHALTI', 'FONEPAY_QR', 'CARD', 'WALLET'])
export const paymentMethod = pgEnum("payment_method", ['COD', 'ESEWA', 'KHALTI'])
export const paymentMethodType = pgEnum("payment_method_type", ['COD', 'ESEWA', 'KHALTI'])
export const paymentProviderId = pgEnum("payment_provider_id", ['SKYPAY', 'KHALTI_DIRECT', 'ESEWA_DIRECT', 'COD_INTERNAL', 'FONEPAY_DIRECT'])
export const paymentStatus = pgEnum("payment_status", ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])
export const posIntegrationStatus = pgEnum("pos_integration_status", ['ACTIVE', 'PAUSED', 'ERROR'])
export const posProvider = pgEnum("pos_provider", ['IMS', 'SQUARE', 'CLOVER', 'CUSTOM'])
export const posSyncStatus = pgEnum("pos_sync_status", ['PENDING', 'SYNCED', 'FAILED', 'RETRYING'])
export const posSyncType = pgEnum("pos_sync_type", ['MENU_PULL', 'ORDER_PUSH', 'INVENTORY_PUSH'])
export const recType = pgEnum("rec_type", ['ALSO_BOUGHT', 'SIMILAR', 'COMPLEMENTARY'])
export const referralStatus = pgEnum("referral_status", ['PENDING', 'COMPLETED', 'REWARDED', 'INVALID'])
export const refundStatus = pgEnum("refund_status", ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'])
export const refundType = pgEnum("refund_type", ['FULL', 'PARTIAL', 'STORE_CREDIT'])
export const riderStatus = pgEnum("rider_status", ['OFFLINE', 'ONLINE', 'BUSY'])
export const riderTier = pgEnum("rider_tier", ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'])
export const settlementStatus = pgEnum("settlement_status", ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])
export const splitStatus = pgEnum("split_status", ['PENDING', 'PAID'])
export const splittingStrategy = pgEnum("splitting_strategy", ['NONE', 'EQUAL', 'ITEMIZED'])
export const staffRole = pgEnum("staff_role", ['MANAGER', 'CASHIER', 'PACKER', 'DRIVER'])
export const staffStatus = pgEnum("staff_status", ['INVITED', 'ACTIVE', 'INACTIVE'])
export const subscriptionEventType = pgEnum("subscription_event_type", ['CREATED', 'RENEWED', 'CANCELLED', 'FAILED', 'EXPIRED'])
export const subscriptionStatus = pgEnum("subscription_status", ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PAYMENT_FAILED'])
export const supportActionStatus = pgEnum("support_action_status", ['REQUESTED', 'APPROVED', 'EXECUTED', 'FAILED'])
export const supportActionType = pgEnum("support_action_type", ['FETCH_ORDER_STATUS', 'ISSUE_WALLET_CREDIT', 'CREATE_TICKET', 'ESCALATE'])
export const targetType = pgEnum("target_type", ['KEYWORD', 'CATEGORY', 'PRODUCT'])
export const trendPeriod = pgEnum("trend_period", ['DAILY', 'WEEKLY'])
export const tripStatus = pgEnum("trip_status", ['PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'])
export const verificationStep = pgEnum("verification_step", ['PENDING_INFO', 'PENDING_DOCS', 'PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'])
export const webhookEventStatus = pgEnum("webhook_event_status", ['RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED'])


export const auditLogs = pgTable("audit_logs", {
	id: text().primaryKey().notNull(),
	actorId: text("actor_id"),
	actorRole: varchar("actor_role", { length: 50 }),
	tenantId: text("tenant_id"),
	action: varchar({ length: 100 }).notNull(),
	resource: varchar({ length: 100 }).notNull(),
	resourceId: text("resource_id"),
	beforeState: jsonb("before_state"),
	afterState: jsonb("after_state"),
	metadata: jsonb(),
	ipAddress: varchar("ip_address", { length: 45 }),
	requestId: text("request_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_action").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("idx_audit_actor").using("btree", table.actorId.asc().nullsLast().op("text_ops")),
	index("idx_audit_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_audit_resource").using("btree", table.resource.asc().nullsLast().op("text_ops")),
	index("idx_audit_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
]);

export const otps = pgTable("otps", {
	id: text().primaryKey().notNull(),
	phone: varchar({ length: 20 }).notNull(),
	otpHash: text("otp_hash").notNull(),
	attempts: text().default('0').notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_otps_expires").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_otps_phone").using("btree", table.phone.asc().nullsLast().op("text_ops")),
]);

export const storeMarketingSubscriptions = pgTable("store_marketing_subscriptions", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	planId: text("plan_id").notNull(),
	status: subscriptionStatus().notNull(),
	startAt: timestamp("start_at", { withTimezone: true, mode: 'string' }).notNull(),
	endAt: timestamp("end_at", { withTimezone: true, mode: 'string' }).notNull(),
	autoRenew: boolean("auto_renew").default(true),
	paymentTokenRef: text("payment_token_ref"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_store_mkt_sub_end").using("btree", table.endAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_store_mkt_sub_store_status").using("btree", table.storeId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_marketing_subscriptions_store_id_stores_id_fk"
		}).onDelete("cascade"),
]);

export const storeMarketingPlans = pgTable("store_marketing_plans", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 120 }).notNull(),
	slug: varchar({ length: 60 }).notNull(),
	description: text(),
	monthlyPrice: numeric("monthly_price", { precision: 12, scale:  2 }).notNull(),
	benefits: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_store_marketing_plans_active").using("btree", table.isActive.asc().nullsLast().op("text_ops"), table.slug.asc().nullsLast().op("text_ops")),
]);

export const paymentAttempts = pgTable("payment_attempts", {
	id: text().primaryKey().notNull(),
	paymentId: text("payment_id").notNull(),
	orderId: text("order_id").notNull(),
	provider: paymentProviderId().notNull(),
	channel: paymentChannel().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: paymentAttemptStatus().default('INITIATED').notNull(),
	providerRef: text("provider_ref"),
	idempotencyKey: text("idempotency_key").notNull(),
	returnUrl: text("return_url"),
	metadata: jsonb(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uidx_payment_attempts_idem").using("btree", table.idempotencyKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "payment_attempts_payment_id_payments_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payment_attempts_order_id_orders_id_fk"
		}),
]);

export const webhookEvents = pgTable("webhook_events", {
	id: text().primaryKey().notNull(),
	provider: paymentProviderId().notNull(),
	externalEventId: text("external_event_id").notNull(),
	paymentId: text("payment_id"),
	orderId: text("order_id"),
	payload: jsonb().notNull(),
	signature: text(),
	status: webhookEventStatus().default('RECEIVED').notNull(),
	errorMessage: text("error_message"),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uidx_webhook_provider_event").using("btree", table.provider.asc().nullsLast().op("text_ops"), table.externalEventId.asc().nullsLast().op("text_ops")),
]);

export const roles = pgTable("roles", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("roles_name_unique").on(table.name),
]);

export const permissions = pgTable("permissions", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	resource: varchar({ length: 100 }).notNull(),
	action: varchar({ length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("permissions_name_unique").on(table.name),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	refreshToken: text("refresh_token").notNull(),
	deviceId: varchar("device_id", { length: 255 }),
	userAgent: text("user_agent"),
	ipAddress: varchar("ip_address", { length: 45 }),
	status: varchar({ length: 20 }).default('ACTIVE').notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_sessions_refresh_token").using("btree", table.refreshToken.asc().nullsLast().op("text_ops")),
	index("idx_sessions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_sessions_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const paymentAuditLogs = pgTable("payment_audit_logs", {
	id: text().primaryKey().notNull(),
	actorType: varchar("actor_type", { length: 32 }).notNull(),
	actorId: text("actor_id"),
	action: varchar({ length: 64 }).notNull(),
	orderId: text("order_id"),
	paymentId: text("payment_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const sellerPayoutRequests = pgTable("seller_payout_requests", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: varchar({ length: 32 }).default('PENDING').notNull(),
	bankAccountRef: text("bank_account_ref"),
	settlementId: text("settlement_id"),
	requestedBy: text("requested_by"),
	approvedBy: text("approved_by"),
	rejectedReason: text("rejected_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "seller_payout_requests_store_id_stores_id_fk"
		}),
]);

export const productVariants = pgTable("product_variants", {
	id: text().primaryKey().notNull(),
	productId: text("product_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	sku: varchar({ length: 100 }),
	priceOffset: numeric("price_offset", { precision: 10, scale:  2 }).default('0'),
	attributes: jsonb(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_variants_product").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const inventory = pgTable("inventory", {
	id: text().primaryKey().notNull(),
	variantId: text("variant_id").notNull(),
	quantity: integer().default(0).notNull(),
	lowStockThreshold: integer("low_stock_threshold").default(5),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_inventory_variant").using("btree", table.variantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "inventory_variant_id_product_variants_id_fk"
		}).onDelete("cascade"),
]);

export const categories = pgTable("categories", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 150 }).notNull(),
	description: text(),
	parentId: text("parent_id"),
	imageUrl: text("image_url"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_categories_parent").using("btree", table.parentId.asc().nullsLast().op("text_ops")),
	index("idx_categories_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("categories_slug_unique").on(table.slug),
]);

export const billingIntents = pgTable("billing_intents", {
	id: text().primaryKey().notNull(),
	payerUserId: text("payer_user_id").notNull(),
	payerType: billingPayerType("payer_type").notNull(),
	storeId: text("store_id"),
	purpose: billingPurpose().notNull(),
	referenceId: text("reference_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	channel: text(),
	status: billingIntentStatus().default('PENDING').notNull(),
	provider: text(),
	providerRef: text("provider_ref"),
	idempotencyKey: text("idempotency_key"),
	metadata: jsonb(),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_billing_intents_idem").using("btree", table.idempotencyKey.asc().nullsLast().op("text_ops")),
	index("idx_billing_intents_payer").using("btree", table.payerUserId.asc().nullsLast().op("text_ops")),
	index("idx_billing_intents_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_billing_intents_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.payerUserId],
			foreignColumns: [users.id],
			name: "billing_intents_payer_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "billing_intents_store_id_stores_id_fk"
		}),
]);

export const notifications = pgTable("notifications", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	type: varchar({ length: 50 }).default('INFO'),
	isRead: boolean("is_read").default(false).notNull(),
	metadata: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const systemConfigs = pgTable("system_configs", {
	key: varchar({ length: 100 }).primaryKey().notNull(),
	value: jsonb().notNull(),
	description: text(),
	updatedBy: text("updated_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_sys_conf_key").using("btree", table.key.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "system_configs_updated_by_users_id_fk"
		}),
]);

export const addresses = pgTable("addresses", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	label: varchar({ length: 50 }).notNull(),
	addressLine: text("address_line").notNull(),
	city: varchar({ length: 100 }).notNull(),
	landmark: varchar({ length: 255 }),
	latitude: real().notNull(),
	longitude: real().notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	contactName: varchar("contact_name", { length: 255 }),
	contactPhone: varchar("contact_phone", { length: 20 }),
	buildingName: varchar("building_name", { length: 255 }),
	floor: varchar({ length: 50 }),
}, (table) => [
	index("idx_addresses_coords").using("btree", table.latitude.asc().nullsLast().op("float4_ops"), table.longitude.asc().nullsLast().op("float4_ops")),
	index("idx_addresses_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "addresses_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const adImpressions = pgTable("ad_impressions", {
	id: text().primaryKey().notNull(),
	campaignId: text("campaign_id").notNull(),
	storeId: text("store_id").notNull(),
	targetId: text("target_id"),
	userId: text("user_id"),
	cost: numeric({ precision: 10, scale:  4 }).notNull(),
	placement: varchar({ length: 50 }).default('SEARCH_LISTING'),
	servedAt: timestamp("served_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_impr_campaign").using("btree", table.campaignId.asc().nullsLast().op("text_ops")),
	index("idx_impr_time").using("btree", table.servedAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const sponsoredCampaigns = pgTable("sponsored_campaigns", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: campaignType().default('SPONSORED_LISTING').notNull(),
	status: campaignStatus().default('ACTIVE').notNull(),
	dailyBudget: numeric("daily_budget", { precision: 10, scale:  2 }).notNull(),
	pacingMode: pacingMode("pacing_mode").default('STANDARD'),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_campaign_status").using("btree", table.status.asc().nullsLast().op("timestamptz_ops"), table.startDate.asc().nullsLast().op("timestamptz_ops"), table.endDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_campaign_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
]);

export const sponsoredTargets = pgTable("sponsored_targets", {
	id: text().primaryKey().notNull(),
	campaignId: text("campaign_id").notNull(),
	targetType: targetType("target_type").notNull(),
	targetValue: varchar("target_value", { length: 255 }).notNull(),
	bidAmount: numeric("bid_amount", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_target_campaign").using("btree", table.campaignId.asc().nullsLast().op("text_ops")),
	index("idx_target_lookup").using("btree", table.targetType.asc().nullsLast().op("text_ops"), table.targetValue.asc().nullsLast().op("text_ops")),
]);

export const analyticsMetrics = pgTable("analytics_metrics", {
	id: text().primaryKey().notNull(),
	date: date().notNull(),
	type: metricType().default('SALES').notNull(),
	metric: text().notNull(),
	value: numeric({ precision: 12, scale:  2 }).notNull(),
	dimensions: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_analytics_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_analytics_metric").using("btree", table.metric.asc().nullsLast().op("text_ops")),
	unique("unq_metric_date_dim").on(table.date, table.metric, table.dimensions),
]);

export const authEvents = pgTable("auth_events", {
	id: text().primaryKey().notNull(),
	userId: text("user_id"),
	eventType: authEventType("event_type").notNull(),
	metadata: jsonb(),
	ipAddress: varchar("ip_address", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const coupons = pgTable("coupons", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	code: varchar({ length: 20 }).notNull(),
	type: couponType().notNull(),
	value: numeric({ precision: 10, scale:  2 }).notNull(),
	minOrderValue: numeric("min_order_value", { precision: 10, scale:  2 }).default('0'),
	maxDiscount: numeric("max_discount", { precision: 10, scale:  2 }),
	requiresGold: boolean("requires_gold").default(false),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }).notNull(),
	usageLimitTotal: integer("usage_limit_total"),
	usageLimitPerUser: integer("usage_limit_per_user").default(1),
	usedCount: integer("used_count").default(0),
	status: couponStatus().default('ACTIVE'),
	createdBy: text("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_coupon_code_store").using("btree", table.code.asc().nullsLast().op("text_ops"), table.storeId.asc().nullsLast().op("text_ops")),
	index("idx_coupon_validity").using("btree", table.startDate.asc().nullsLast().op("enum_ops"), table.endDate.asc().nullsLast().op("timestamptz_ops"), table.status.asc().nullsLast().op("timestamptz_ops")),
]);

export const couponRedemptions = pgTable("coupon_redemptions", {
	id: text().primaryKey().notNull(),
	couponId: text("coupon_id").notNull(),
	userId: text("user_id").notNull(),
	orderId: text("order_id").notNull(),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_redemption_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("idx_redemption_user").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.couponId.asc().nullsLast().op("text_ops")),
]);

export const loyaltyLedger = pgTable("loyalty_ledger", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	type: loyaltyType().notNull(),
	orderId: text("order_id"),
	balanceAfter: numeric("balance_after", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	metadata: text(),
}, (table) => [
	index("idx_loyalty_ledger_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_loyalty_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
]);

export const referralCodes = pgTable("referral_codes", {
	userId: text("user_id").primaryKey().notNull(),
	code: varchar({ length: 20 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("referral_codes_code_unique").on(table.code),
]);

export const referralRewards = pgTable("referral_rewards", {
	id: text().primaryKey().notNull(),
	referrerId: text("referrer_id").notNull(),
	refereeId: text("referee_id").notNull(),
	status: referralStatus().default('PENDING'),
	rewardAmount: numeric("reward_amount", { precision: 10, scale:  2 }).notNull(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_referral_referee").using("btree", table.refereeId.asc().nullsLast().op("text_ops")),
	index("idx_referral_referrer").using("btree", table.referrerId.asc().nullsLast().op("text_ops")),
]);

export const codRecords = pgTable("cod_records", {
	id: text().primaryKey().notNull(),
	deliveryTaskId: text("delivery_task_id").notNull(),
	orderId: text("order_id").notNull(),
	riderId: text("rider_id").notNull(),
	expectedAmount: numeric("expected_amount", { precision: 10, scale:  2 }).notNull(),
	collectedAmount: numeric("collected_amount", { precision: 10, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	isReconciled: boolean("is_reconciled").default(false),
	reconciledAt: timestamp("reconciled_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_cod_rider").using("btree", table.riderId.asc().nullsLast().op("text_ops")),
	index("idx_cod_task").using("btree", table.deliveryTaskId.asc().nullsLast().op("text_ops")),
]);

export const policyViolations = pgTable("policy_violations", {
	id: text().primaryKey().notNull(),
	actorId: text("actor_id").notNull(),
	policyType: varchar("policy_type", { length: 50 }).notNull(),
	reason: text().notNull(),
	resource: varchar({ length: 50 }),
	resourceId: text("resource_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_policy_actor").using("btree", table.actorId.asc().nullsLast().op("text_ops")),
	index("idx_policy_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_policy_type").using("btree", table.policyType.asc().nullsLast().op("text_ops")),
]);

export const searchSynonyms = pgTable("search_synonyms", {
	id: text().primaryKey().notNull(),
	term: text().notNull(),
	language: text().default('EN'),
	expansions: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const riders = pgTable("riders", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	vehicleType: varchar("vehicle_type", { length: 50 }).notNull(),
	licensePlate: varchar("license_plate", { length: 50 }).notNull(),
	status: riderStatus().default('OFFLINE').notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	currentLat: real("current_lat"),
	currentLon: real("current_lon"),
	lastLocationUpdate: timestamp("last_location_update", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	totalEarnings: numeric("total_earnings", { precision: 10, scale:  2 }).default('0'),
	pendingSettlement: numeric("pending_settlement", { precision: 10, scale:  2 }).default('0'),
	walletBalance: numeric("wallet_balance", { precision: 10, scale:  2 }).default('0'),
	tier: varchar({ length: 20 }).default('BRONZE'),
	earnings: numeric({ precision: 10, scale:  2 }).default('0'),
	isEv: boolean("is_ev").default(false),
	codCashInHand: numeric("cod_cash_in_hand", { precision: 10, scale:  2 }).default('0'),
	maxWalletLimit: numeric("max_wallet_limit", { precision: 10, scale:  2 }).default('5000'),
}, (table) => [
	index("idx_riders_location").using("btree", table.currentLat.asc().nullsLast().op("float4_ops"), table.currentLon.asc().nullsLast().op("float4_ops")),
	index("idx_riders_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_riders_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "riders_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const disputes = pgTable("disputes", {
	id: text().primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	reporterId: text("reporter_id").notNull(),
	reason: text().notNull(),
	status: disputeStatus().default('OPEN').notNull(),
	resolvedBy: text("resolved_by"),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	type: disputeType().default('OTHER').notNull(),
	priority: varchar({ length: 20 }).default('MEDIUM').notNull(),
	evidenceUrls: jsonb("evidence_urls"),
	resolution: jsonb(),
}, (table) => [
	index("idx_disputes_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("idx_disputes_reporter").using("btree", table.reporterId.asc().nullsLast().op("text_ops")),
	index("idx_disputes_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "disputes_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [users.id],
			name: "disputes_reporter_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.resolvedBy],
			foreignColumns: [users.id],
			name: "disputes_resolved_by_users_id_fk"
		}),
]);

export const featureFlags = pgTable("feature_flags", {
	id: text().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	description: text(),
	isEnabled: boolean("is_enabled").default(false).notNull(),
	env: varchar({ length: 20 }).default('production').notNull(),
	tenantId: text("tenant_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	rules: jsonb().default([]),
	clientSide: boolean("client_side").default(false).notNull(),
}, (table) => [
	uniqueIndex("idx_flag_key_env_tenant").using("btree", table.key.asc().nullsLast().op("text_ops"), table.env.asc().nullsLast().op("text_ops"), table.tenantId.asc().nullsLast().op("text_ops")),
]);

export const cartItems = pgTable("cart_items", {
	id: text().primaryKey().notNull(),
	cartId: text("cart_id").notNull(),
	variantId: text("variant_id").notNull(),
	quantity: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	addedBy: text("added_by"),
}, (table) => [
	index("idx_cart_items_cart").using("btree", table.cartId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_items_cart_id_carts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "cart_items_variant_id_product_variants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.addedBy],
			foreignColumns: [users.id],
			name: "cart_items_added_by_users_id_fk"
		}),
]);

export const carts = pgTable("carts", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	storeId: text("store_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	type: cartType().default('SINGLE').notNull(),
	status: cartStatus().default('OPEN').notNull(),
	shareCode: varchar("share_code", { length: 20 }),
}, (table) => [
	index("idx_carts_share").using("btree", table.shareCode.asc().nullsLast().op("text_ops")),
	index("idx_carts_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "carts_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "carts_store_id_stores_id_fk"
		}).onDelete("cascade"),
	unique("carts_share_code_unique").on(table.shareCode),
]);

export const orderItems = pgTable("order_items", {
	id: text().primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	variantId: text("variant_id").notNull(),
	productName: varchar("product_name", { length: 255 }).notNull(),
	quantity: integer().notNull(),
	priceAtPurchase: numeric("price_at_purchase", { precision: 10, scale:  2 }).notNull(),
	metadata: jsonb(),
}, (table) => [
	index("idx_order_items_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "order_items_variant_id_product_variants_id_fk"
		}),
]);

export const deviceCredentials = pgTable("device_credentials", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	deviceId: text("device_id").notNull(),
	publicKey: text("public_key").notNull(),
	counter: integer().default(0).notNull(),
	transports: jsonb(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_device_creds_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "device_credentials_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userIdentities = pgTable("user_identities", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	provider: identityProvider().notNull(),
	providerId: text("provider_id").notNull(),
	email: varchar({ length: 255 }),
	metadata: jsonb(),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_identities_provider").using("btree", table.provider.asc().nullsLast().op("text_ops"), table.providerId.asc().nullsLast().op("text_ops")),
	index("idx_identities_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_identities_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const groupOrderSplits = pgTable("group_order_splits", {
	id: text().primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	userId: text("user_id").notNull(),
	amountOwed: numeric("amount_owed", { precision: 10, scale:  2 }).notNull(),
	amountPaid: numeric("amount_paid", { precision: 10, scale:  2 }).default('0').notNull(),
	status: splitStatus().default('PENDING').notNull(),
	transactionRef: text("transaction_ref"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_splits_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("idx_splits_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "group_order_splits_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "group_order_splits_user_id_users_id_fk"
		}),
]);

export const disputeMessages = pgTable("dispute_messages", {
	id: text().primaryKey().notNull(),
	disputeId: text("dispute_id").notNull(),
	senderId: text("sender_id").notNull(),
	senderRole: varchar("sender_role", { length: 50 }).notNull(),
	message: text().notNull(),
	attachments: jsonb(),
	isInternal: boolean("is_internal").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_dispute_messages_dispute").using("btree", table.disputeId.asc().nullsLast().op("text_ops")),
	index("idx_dispute_messages_sender").using("btree", table.senderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.disputeId],
			foreignColumns: [disputes.id],
			name: "dispute_messages_dispute_id_disputes_id_fk"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "dispute_messages_sender_id_users_id_fk"
		}),
]);

export const masterProductTemplates = pgTable("master_product_templates", {
	id: text().primaryKey().notNull(),
	masterMerchantId: text("master_merchant_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	basePrice: numeric("base_price", { precision: 10, scale:  2 }).notNull(),
	categoryId: text("category_id").notNull(),
	images: jsonb(),
	zoneRates: jsonb("zone_rates"),
	metadata: jsonb(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_templates_master").using("btree", table.masterMerchantId.asc().nullsLast().op("text_ops")),
]);

export const branchProductLinks = pgTable("branch_product_links", {
	branchStoreId: text("branch_store_id").notNull(),
	templateId: text("template_id").notNull(),
	productId: text("product_id").notNull(),
	priceOverride: numeric("price_override", { precision: 10, scale:  2 }),
	isLocalOverride: boolean("is_local_override").default(false).notNull(),
	isSynced: boolean("is_synced").default(true),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_links_branch").using("btree", table.branchStoreId.asc().nullsLast().op("text_ops")),
	index("idx_links_template").using("btree", table.templateId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [masterProductTemplates.id],
			name: "branch_product_links_template_id_master_product_templates_id_fk"
		}).onDelete("cascade"),
]);

export const masterMerchants = pgTable("master_merchants", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	ownerId: text("owner_id").notNull(),
	branchIds: jsonb("branch_ids"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_master_owner").using("btree", table.ownerId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "master_merchants_owner_id_users_id_fk"
		}),
]);

export const riderTiers = pgTable("rider_tiers", {
	id: text().primaryKey().notNull(),
	riderId: text("rider_id").notNull(),
	tier: riderTier().default('BRONZE').notNull(),
	monthlyOrders: integer("monthly_orders").default(0),
	rating: integer().default(500),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_rider_tiers_rider").using("btree", table.riderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.riderId],
			foreignColumns: [riders.id],
			name: "rider_tiers_rider_id_riders_id_fk"
		}).onDelete("cascade"),
	unique("rider_tiers_rider_id_unique").on(table.riderId),
]);

export const flashSaleEvents = pgTable("flash_sale_events", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	startAt: timestamp("start_at", { withTimezone: true, mode: 'string' }).notNull(),
	endAt: timestamp("end_at", { withTimezone: true, mode: 'string' }).notNull(),
	status: flashSaleStatus().default('SCHEDULED').notNull(),
	maxRps: integer("max_rps").default(100).notNull(),
	strictRateLimitProfileId: text("strict_rate_limit_profile_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_fs_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_fs_time").using("btree", table.startAt.asc().nullsLast().op("timestamptz_ops"), table.endAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const hotItemConfig = pgTable("hot_item_config", {
	id: text().primaryKey().notNull(),
	eventId: text("event_id").notNull(),
	variantId: text("variant_id").notNull(),
	initialStock: integer("initial_stock").notNull(),
	shardCount: integer("shard_count").default(16).notNull(),
	reservedStock: integer("reserved_stock").default(0).notNull(),
	oversellBuffer: integer("oversell_buffer").default(0).notNull(),
	status: hotItemStatus().default('ACTIVE').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_hot_event").using("btree", table.eventId.asc().nullsLast().op("text_ops")),
	index("idx_hot_variant").using("btree", table.variantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [flashSaleEvents.id],
			name: "hot_item_config_event_id_flash_sale_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "hot_item_config_variant_id_product_variants_id_fk"
		}),
]);

export const riderLeaderboards = pgTable("rider_leaderboards", {
	id: text().primaryKey().notNull(),
	riderId: text("rider_id").notNull(),
	yearMonth: varchar("year_month", { length: 7 }).notNull(),
	score: numeric({ precision: 10, scale:  2 }).notNull(),
	rank: integer().notNull(),
	city: varchar({ length: 100 }),
	computedAt: timestamp("computed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_leaderboard_month").using("btree", table.yearMonth.asc().nullsLast().op("text_ops")),
	index("idx_leaderboard_rank").using("btree", table.rank.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.riderId],
			foreignColumns: [riders.id],
			name: "rider_leaderboards_rider_id_riders_id_fk"
		}).onDelete("cascade"),
]);

export const riderPerformanceMonthly = pgTable("rider_performance_monthly", {
	id: text().primaryKey().notNull(),
	riderId: text("rider_id").notNull(),
	yearMonth: varchar("year_month", { length: 7 }).notNull(),
	completedOrders: integer("completed_orders").default(0).notNull(),
	acceptanceRate: numeric("acceptance_rate", { precision: 5, scale:  2 }).default('0').notNull(),
	cancellationRate: numeric("cancellation_rate", { precision: 5, scale:  2 }).default('0').notNull(),
	avgRating: numeric("avg_rating", { precision: 3, scale:  2 }).default('0').notNull(),
	onTimeRate: numeric("on_time_rate", { precision: 5, scale:  2 }).default('0').notNull(),
	safetyFlags: integer("safety_flags").default(0).notNull(),
	computedAt: timestamp("computed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_perf_month").using("btree", table.yearMonth.asc().nullsLast().op("text_ops")),
	index("idx_perf_rider").using("btree", table.riderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.riderId],
			foreignColumns: [riders.id],
			name: "rider_performance_monthly_rider_id_riders_id_fk"
		}).onDelete("cascade"),
]);

export const sellerBadges = pgTable("seller_badges", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	badgeType: badgeType("badge_type").notNull(),
	window: badgeWindow().default('WEEKLY').notNull(),
	scoreSnapshot: numeric("score_snapshot", { precision: 10, scale:  2 }),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_badges_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	index("idx_badges_type").using("btree", table.badgeType.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "seller_badges_store_id_stores_id_fk"
		}).onDelete("cascade"),
]);

export const cartParticipants = pgTable("cart_participants", {
	id: text().primaryKey().notNull(),
	cartId: text("cart_id").notNull(),
	userId: text("user_id").notNull(),
	role: participantRole().default('MEMBER').notNull(),
	status: participantStatus().default('ACTIVE').notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_cp_cart").using("btree", table.cartId.asc().nullsLast().op("text_ops")),
	index("idx_cp_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_participants_cart_id_carts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cart_participants_user_id_users_id_fk"
		}),
]);

export const payments = pgTable("payments", {
	id: text().primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	method: paymentMethodType().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: paymentStatus().default('PENDING').notNull(),
	gatewayRef: text("gateway_ref"),
	idempotencyKey: text("idempotency_key"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_payments_idem").using("btree", table.idempotencyKey.asc().nullsLast().op("text_ops")),
	index("idx_payments_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("idx_payments_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payments_order_id_orders_id_fk"
		}),
]);

export const escrow = pgTable("escrow", {
	id: text().primaryKey().notNull(),
	paymentId: text("payment_id"),
	orderId: text("order_id").notNull(),
	tenantId: text("tenant_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: escrowStatus().default('HELD').notNull(),
	ledgerJournalId: text("ledger_journal_id"),
	settlementId: text("settlement_id"),
	releasedAt: timestamp("released_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_escrow_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("idx_escrow_payment").using("btree", table.paymentId.asc().nullsLast().op("text_ops")),
	index("idx_escrow_settlement").using("btree", table.settlementId.asc().nullsLast().op("text_ops")),
	index("idx_escrow_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "escrow_payment_id_payments_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "escrow_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [stores.id],
			name: "escrow_tenant_id_stores_id_fk"
		}),
]);

export const ledgerAccounts = pgTable("ledger_accounts", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id"),
	name: varchar({ length: 100 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	description: text(),
	balance: numeric({ precision: 12, scale:  2 }).default('0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ledger_accounts_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("idx_ledger_accounts_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
]);

export const ledgerEntries = pgTable("ledger_entries", {
	id: text().primaryKey().notNull(),
	journalId: text("journal_id").notNull(),
	accountId: text("account_id").notNull(),
	refType: varchar("ref_type", { length: 50 }).notNull(),
	refId: text("ref_id").notNull(),
	description: text(),
	type: varchar({ length: 10 }).notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	idempotencyKey: text("idempotency_key"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ledger_account").using("btree", table.accountId.asc().nullsLast().op("text_ops")),
	index("idx_ledger_idem").using("btree", table.idempotencyKey.asc().nullsLast().op("text_ops")),
	index("idx_ledger_journal").using("btree", table.journalId.asc().nullsLast().op("text_ops")),
	index("idx_ledger_ref").using("btree", table.refType.asc().nullsLast().op("text_ops"), table.refId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [ledgerAccounts.id],
			name: "ledger_entries_account_id_ledger_accounts_id_fk"
		}),
]);

export const paymentRecords = pgTable("payment_records", {
	id: text().primaryKey().notNull(),
	paymentId: text("payment_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "payment_records_payment_id_payments_id_fk"
		}),
]);

export const refunds = pgTable("refunds", {
	id: text().primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	paymentId: text("payment_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	type: refundType().default('FULL').notNull(),
	status: refundStatus().default('PENDING').notNull(),
	reason: text(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	ledgerJournalId: text("ledger_journal_id"),
	escrowId: text("escrow_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_refunds_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("idx_refunds_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "refunds_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [payments.id],
			name: "refunds_payment_id_payments_id_fk"
		}),
]);

export const settlements = pgTable("settlements", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	periodStart: timestamp("period_start", { withTimezone: true, mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { withTimezone: true, mode: 'string' }).notNull(),
	grossAmount: numeric("gross_amount", { precision: 10, scale:  2 }).notNull(),
	commissionAmount: numeric("commission_amount", { precision: 10, scale:  2 }).notNull(),
	deliveryFees: numeric("delivery_fees", { precision: 10, scale:  2 }).default('0'),
	refundAdjustments: numeric("refund_adjustments", { precision: 10, scale:  2 }).default('0'),
	netAmount: numeric("net_amount", { precision: 10, scale:  2 }).notNull(),
	status: settlementStatus().default('PENDING').notNull(),
	transactionRef: text("transaction_ref"),
	executedAt: timestamp("executed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_settlements_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_settlements_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "settlements_store_id_stores_id_fk"
		}),
]);

export const settlementItems = pgTable("settlement_items", {
	id: text().primaryKey().notNull(),
	settlementId: text("settlement_id").notNull(),
	escrowId: text("escrow_id").notNull(),
	orderId: text("order_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	fee: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_settlement_items_cycle").using("btree", table.settlementId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.settlementId],
			foreignColumns: [settlements.id],
			name: "settlement_items_settlement_id_settlements_id_fk"
		}),
	foreignKey({
			columns: [table.escrowId],
			foreignColumns: [escrow.id],
			name: "settlement_items_escrow_id_escrow_id_fk"
		}),
]);

export const predictiveAlerts = pgTable("predictive_alerts", {
	id: text().primaryKey().notNull(),
	riderId: text("rider_id").notNull(),
	message: text().notNull(),
	targetLocation: jsonb("target_location"),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_alert_rider").using("btree", table.riderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.riderId],
			foreignColumns: [riders.id],
			name: "predictive_alerts_rider_id_riders_id_fk"
		}),
]);

export const riderDeposits = pgTable("rider_deposits", {
	id: text().primaryKey().notNull(),
	riderId: text("rider_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: depositStatus().default('PENDING').notNull(),
	referenceCode: varchar("reference_code", { length: 50 }),
	proofUrl: text("proof_url"),
	verifiedBy: text("verified_by"),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_deposit_rider").using("btree", table.riderId.asc().nullsLast().op("text_ops")),
	index("idx_deposit_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.riderId],
			foreignColumns: [riders.id],
			name: "rider_deposits_rider_id_riders_id_fk"
		}),
]);

export const tripTasks = pgTable("trip_tasks", {
	id: text().primaryKey().notNull(),
	riderId: text("rider_id"),
	status: tripStatus().default('PLANNED').notNull(),
	routePlan: jsonb("route_plan"),
	totalDistance: numeric("total_distance", { precision: 10, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_trip_rider").using("btree", table.riderId.asc().nullsLast().op("text_ops")),
	index("idx_trip_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.riderId],
			foreignColumns: [riders.id],
			name: "trip_tasks_rider_id_riders_id_fk"
		}),
]);

export const posIntegrations = pgTable("pos_integrations", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	provider: posProvider().notNull(),
	config: text().notNull(),
	status: posIntegrationStatus().default('ACTIVE').notNull(),
	lastSyncAt: timestamp("last_sync_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_pos_integrations_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "pos_integrations_store_id_stores_id_fk"
		}).onDelete("cascade"),
]);

export const posOrderMappings = pgTable("pos_order_mappings", {
	id: text().primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	externalOrderId: varchar("external_order_id", { length: 255 }),
	syncStatus: posSyncStatus("sync_status").default('PENDING').notNull(),
	retryCount: integer("retry_count").default(0).notNull(),
	lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true, mode: 'string' }),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_pos_order_map_external").using("btree", table.externalOrderId.asc().nullsLast().op("text_ops")),
	index("idx_pos_order_map_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "pos_order_mappings_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const posProductMappings = pgTable("pos_product_mappings", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	productId: text("product_id").notNull(),
	variantId: text("variant_id"),
	externalProductId: varchar("external_product_id", { length: 255 }).notNull(),
	externalVariantId: varchar("external_variant_id", { length: 255 }),
	lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_pos_map_external").using("btree", table.externalProductId.asc().nullsLast().op("text_ops")),
	index("idx_pos_map_product").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	index("idx_pos_map_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "pos_product_mappings_store_id_stores_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "pos_product_mappings_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "pos_product_mappings_variant_id_product_variants_id_fk"
		}).onDelete("cascade"),
]);

export const posSyncLogs = pgTable("pos_sync_logs", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	type: posSyncType().notNull(),
	status: posSyncStatus().notNull(),
	payload: jsonb(),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_pos_logs_date").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_pos_logs_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "pos_sync_logs_store_id_stores_id_fk"
		}),
]);

export const invoices = pgTable("invoices", {
	id: text().primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	storeId: text("store_id").notNull(),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	type: invoiceType().default('INVOICE').notNull(),
	status: invoiceStatus().default('DRAFT').notNull(),
	issueDate: timestamp("issue_date", { withTimezone: true, mode: 'string' }),
	currency: varchar({ length: 3 }).default('NPR').notNull(),
	buyerDetails: jsonb("buyer_details"),
	totals: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_invoices_number").using("btree", table.invoiceNumber.asc().nullsLast().op("text_ops")),
	index("idx_invoices_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("idx_invoices_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_invoices_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "invoices_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "invoices_store_id_stores_id_fk"
		}),
]);

export const invoiceLines = pgTable("invoice_lines", {
	id: text().primaryKey().notNull(),
	invoiceId: text("invoice_id").notNull(),
	type: invoiceLineType().notNull(),
	description: text().notNull(),
	quantity: integer().default(1).notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	netAmount: numeric("net_amount", { precision: 10, scale:  2 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale:  2 }).default('0'),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).default('0'),
	grossAmount: numeric("gross_amount", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_invoice_lines_invoice").using("btree", table.invoiceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "invoice_lines_invoice_id_invoices_id_fk"
		}).onDelete("cascade"),
]);

export const taxProfiles = pgTable("tax_profiles", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id"),
	legalName: varchar("legal_name", { length: 255 }).notNull(),
	vatNumber: varchar("vat_number", { length: 50 }),
	address: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	isVatRegistered: boolean("is_vat_registered").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tax_profiles_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "tax_profiles_store_id_stores_id_fk"
		}),
]);

export const wishlists = pgTable("wishlists", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	productId: text("product_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_wishlists_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wishlists_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "wishlists_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const storeStaff = pgTable("store_staff", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	userId: text("user_id").notNull(),
	status: staffStatus().default('INVITED').notNull(),
	invitedBy: text("invited_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_staff_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	index("idx_staff_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "store_staff_store_id_stores_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "store_staff_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "store_staff_invited_by_users_id_fk"
		}),
]);

export const policies = pgTable("policies", {
	id: text().primaryKey().notNull(),
	category: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	version: varchar({ length: 20 }).notNull(),
	effectiveDate: timestamp("effective_date", { withTimezone: true, mode: 'string' }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdBy: text("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_policies_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_policies_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "policies_created_by_users_id_fk"
		}),
]);

export const userConsents = pgTable("user_consents", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	policyId: text("policy_id").notNull(),
	consentedAt: timestamp("consented_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
}, (table) => [
	index("idx_consents_policy").using("btree", table.policyId.asc().nullsLast().op("text_ops")),
	index("idx_consents_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_consents_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.policyId],
			foreignColumns: [policies.id],
			name: "user_consents_policy_id_policies_id_fk"
		}),
]);

export const searchDocuments = pgTable("search_documents", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	language: text().default('MIXED'),
	title: text().notNull(),
	description: text(),
	tags: jsonb(),
	categoryId: text("category_id"),
	price: numeric({ precision: 10, scale:  2 }),
	storeId: text("store_id"),
	isActive: boolean("is_active").default(true),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_search_docs_entity").using("btree", table.entityId.asc().nullsLast().op("text_ops"), table.entityType.asc().nullsLast().op("text_ops")),
	index("idx_search_docs_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	index("idx_search_docs_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
]);

export const searchEmbeddings = pgTable("search_embeddings", {
	id: text().primaryKey().notNull(),
	documentId: text("document_id").notNull(),
	embedding: vector({ dimensions: 1536 }),
	modelVersion: text("model_version").default('v1'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_search_emb_doc").using("btree", table.documentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [searchDocuments.id],
			name: "search_embeddings_document_id_search_documents_id_fk"
		}).onDelete("cascade"),
]);

export const userSubscriptions = pgTable("user_subscriptions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	planId: text("plan_id").notNull(),
	status: subscriptionStatus().notNull(),
	startAt: timestamp("start_at", { withTimezone: true, mode: 'string' }).notNull(),
	endAt: timestamp("end_at", { withTimezone: true, mode: 'string' }).notNull(),
	autoRenew: boolean("auto_renew").default(true),
	paymentTokenRef: text("payment_token_ref"),
	lastRenewalAttemptAt: timestamp("last_renewal_attempt_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_subs_expiry").using("btree", table.endAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_subs_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_subscriptions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [subscriptionPlans.id],
			name: "user_subscriptions_plan_id_subscription_plans_id_fk"
		}),
]);

export const subscriptionEvents = pgTable("subscription_events", {
	id: text().primaryKey().notNull(),
	userSubscriptionId: text("user_subscription_id").notNull(),
	type: subscriptionEventType().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const productRecommendations = pgTable("product_recommendations", {
	id: text().primaryKey().notNull(),
	sourceProductId: text("source_product_id").notNull(),
	targetProductId: text("target_product_id").notNull(),
	score: numeric({ precision: 5, scale:  4 }).notNull(),
	type: recType().default('ALSO_BOUGHT').notNull(),
	algorithmVersion: text("algorithm_version").default('v1'),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_rec_source").using("btree", table.sourceProductId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sourceProductId],
			foreignColumns: [products.id],
			name: "product_recommendations_source_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.targetProductId],
			foreignColumns: [products.id],
			name: "product_recommendations_target_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("unq_rec_pair_type").on(table.sourceProductId, table.targetProductId, table.type),
]);

export const trendingProducts = pgTable("trending_products", {
	id: text().primaryKey().notNull(),
	productId: text("product_id").notNull(),
	score: numeric({ precision: 10, scale:  2 }).notNull(),
	period: trendPeriod().default('WEEKLY').notNull(),
	rank: integer().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_trend_period").using("btree", table.period.asc().nullsLast().op("enum_ops")),
	index("idx_trend_rank").using("btree", table.rank.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "trending_products_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("unq_trend_product_period").on(table.productId, table.period),
]);

export const supportConversations = pgTable("support_conversations", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	orderId: text("order_id"),
	channel: varchar({ length: 50 }).default('IN_APP').notNull(),
	status: conversationStatus().default('BOT_ACTIVE').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_support_conv_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_support_conv_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "support_conversations_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "support_conversations_order_id_orders_id_fk"
		}),
]);

export const supportActions = pgTable("support_actions", {
	id: text().primaryKey().notNull(),
	conversationId: text("conversation_id").notNull(),
	actionType: supportActionType("action_type").notNull(),
	status: supportActionStatus().default('REQUESTED').notNull(),
	payload: jsonb(),
	idempotencyKey: text("idempotency_key"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [supportConversations.id],
			name: "support_actions_conversation_id_support_conversations_id_fk"
		}),
]);

export const supportMessages = pgTable("support_messages", {
	id: text().primaryKey().notNull(),
	conversationId: text("conversation_id").notNull(),
	sender: messageSender().notNull(),
	message: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_support_msg_conv").using("btree", table.conversationId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [supportConversations.id],
			name: "support_messages_conversation_id_support_conversations_id_fk"
		}),
]);

export const subscriptionPlans = pgTable("subscription_plans", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	durationDays: integer("duration_days").notNull(),
	deliveryFreeThreshold: numeric("delivery_free_threshold", { precision: 10, scale:  2 }),
	isPriorityDelivery: boolean("is_priority_delivery").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	slug: varchar({ length: 60 }),
	benefits: jsonb().default({}).notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
	id: text().primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	status: orderStatus().notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_order_history_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_status_history_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const deliveryTasks = pgTable("delivery_tasks", {
	id: text().primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	riderId: text("rider_id"),
	status: deliveryTaskStatus().default('PENDING').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	tripTaskId: text("trip_task_id"),
	acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: 'string' }),
	pickedUpAt: timestamp("picked_up_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	codCollected: boolean("cod_collected").default(false),
	codAmount: numeric("cod_amount", { precision: 10, scale:  2 }),
	codCollectedAt: timestamp("cod_collected_at", { withTimezone: true, mode: 'string' }),
	deliveryFee: numeric("delivery_fee", { precision: 10, scale:  2 }),
	platformFee: numeric("platform_fee", { precision: 10, scale:  2 }),
	riderEarnings: numeric("rider_earnings", { precision: 10, scale:  2 }),
	failureReason: text("failure_reason"),
	podImageUrl: text("pod_image_url"),
	podNotes: text("pod_notes"),
}, (table) => [
	index("idx_delivery_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("idx_delivery_rider").using("btree", table.riderId.asc().nullsLast().op("text_ops")),
	index("idx_delivery_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.riderId],
			foreignColumns: [riders.id],
			name: "delivery_tasks_rider_id_riders_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "delivery_tasks_order_id_orders_id_fk"
		}),
]);

export const orders = pgTable("orders", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	storeId: text("store_id").notNull(),
	status: orderStatus().default('PLACED').notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	deliveryAddressId: text("delivery_address_id"),
	paymentMethod: paymentMethod("payment_method").default('COD').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	paymentStatus: paymentStatus("payment_status").default('PENDING').notNull(),
	splittingStrategy: splittingStrategy("splitting_strategy").default('NONE').notNull(),
	paymentCollectionStatus: collectionStatus("payment_collection_status").default('NOT_REQUIRED').notNull(),
	isPriorityDelivery: boolean("is_priority_delivery").default(false),
	isGreenDelivery: boolean("is_green_delivery").default(false),
	fulfillmentType: orderFulfillmentType("fulfillment_type").default('MERCHANT_DELIVERY').notNull(),
	commissionRateSnapshot: real("commission_rate_snapshot").default(10).notNull(),
	pricingSnapshot: jsonb("pricing_snapshot"),
}, (table) => [
	index("idx_orders_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	index("idx_orders_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "orders_store_id_stores_id_fk"
		}),
	foreignKey({
			columns: [table.deliveryAddressId],
			foreignColumns: [addresses.id],
			name: "orders_delivery_address_id_addresses_id_fk"
		}),
]);

export const reviews = pgTable("reviews", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	orderId: text("order_id").notNull(),
	storeId: text("store_id").notNull(),
	productId: text("product_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	isVerifiedPurchase: boolean("is_verified_purchase").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ownerReply: text("owner_reply"),
	ownerRepliedAt: timestamp("owner_replied_at", { withTimezone: true, mode: 'string' }),
	isModerated: boolean("is_moderated").default(false).notNull(),
	isHidden: boolean("is_hidden").default(false).notNull(),
	moderatorNote: text("moderator_note"),
	moderatedBy: text("moderated_by"),
	moderatedAt: timestamp("moderated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_reviews_order").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("idx_reviews_product").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	index("idx_reviews_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	index("idx_reviews_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "reviews_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "reviews_store_id_stores_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "reviews_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.moderatedBy],
			foreignColumns: [users.id],
			name: "reviews_moderated_by_users_id_fk"
		}),
]);

export const storeCategories = pgTable("store_categories", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	icon: varchar({ length: 50 }),
	requiredProductFields: jsonb("required_product_fields"),
	orderStatusFlow: jsonb("order_status_flow"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_store_categories_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("store_categories_slug_unique").on(table.slug),
]);

export const products = pgTable("products", {
	id: text().primaryKey().notNull(),
	storeId: text("store_id").notNull(),
	categoryId: text("category_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 300 }).notNull(),
	description: text(),
	images: jsonb(),
	basePrice: numeric("base_price", { precision: 10, scale:  2 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	isArchived: boolean("is_archived").default(false).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	compareAtPrice: numeric("compare_at_price", { precision: 10, scale:  2 }),
	isDeliverable: boolean("is_deliverable").default(true).notNull(),
	dynamicAttributes: jsonb("dynamic_attributes"),
}, (table) => [
	index("idx_products_category").using("btree", table.categoryId.asc().nullsLast().op("text_ops")),
	index("idx_products_search").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("idx_products_store").using("btree", table.storeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "products_store_id_stores_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	phone: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	avatarUrl: text("avatar_url"),
	isActive: boolean("is_active").default(true).notNull(),
	isPhoneVerified: boolean("is_phone_verified").default(false).notNull(),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	passwordHash: text("password_hash"),
	preferredLanguage: varchar("preferred_language", { length: 10 }).default('en'),
	dataExportRequestedAt: timestamp("data_export_requested_at", { withTimezone: true, mode: 'string' }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	googleId: text("google_id"),
}, (table) => [
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_phone").using("btree", table.phone.asc().nullsLast().op("text_ops")),
	unique("users_phone_unique").on(table.phone),
]);

export const stores = pgTable("stores", {
	id: text().primaryKey().notNull(),
	ownerId: text("owner_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	status: varchar({ length: 50 }).default('PENDING').notNull(),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	address: text(),
	latitude: real(),
	longitude: real(),
	deliveryRadius: real("delivery_radius"),
	logoUrl: text("logo_url"),
	bannerUrl: text("banner_url"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	adminNotes: text("admin_notes"),
	commissionRate: real("commission_rate").default(10),
	operatingHours: jsonb("operating_hours"),
	kycDocumentUrl: text("kyc_document_url"),
	kycStatus: varchar("kyc_status", { length: 50 }).default('PENDING'),
	masterMerchantId: text("master_merchant_id"),
	branchZone: varchar("branch_zone", { length: 50 }),
	shopType: varchar("shop_type", { length: 50 }).default('GROCERY').notNull(),
	deliveryType: varchar("delivery_type", { length: 50 }).default('MERCHANT_SELF').notNull(),
	storeCategoryId: text("store_category_id"),
	isOpen: boolean("is_open").default(true).notNull(),
	isBusyMode: boolean("is_busy_mode").default(false).notNull(),
	busyModeEtaMinutes: real("busy_mode_eta_minutes"),
	kycBusinessName: varchar("kyc_business_name", { length: 255 }),
	kycPanVat: varchar("kyc_pan_vat", { length: 50 }),
	kycAddress: text("kyc_address"),
	kycStoreLicenseUrl: text("kyc_store_license_url"),
	kycStorePhotos: jsonb("kyc_store_photos"),
	verificationStep: verificationStep("verification_step").default('PENDING_INFO'),
	verificationSubmittedAt: timestamp("verification_submitted_at", { withTimezone: true, mode: 'string' }),
	verificationReviewedAt: timestamp("verification_reviewed_at", { withTimezone: true, mode: 'string' }),
	parentStoreId: text("parent_store_id"),
}, (table) => [
	index("idx_stores_category").using("btree", table.storeCategoryId.asc().nullsLast().op("text_ops")),
	index("idx_stores_master").using("btree", table.masterMerchantId.asc().nullsLast().op("text_ops")),
	index("idx_stores_owner").using("btree", table.ownerId.asc().nullsLast().op("text_ops")),
	index("idx_stores_parent").using("btree", table.parentStoreId.asc().nullsLast().op("text_ops")),
	index("idx_stores_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_stores_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_stores_verification").using("btree", table.verificationStep.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "stores_owner_id_users_id_fk"
		}),
	unique("stores_slug_unique").on(table.slug),
]);

export const storeStaffRoles = pgTable("store_staff_roles", {
	id: text().primaryKey().notNull(),
	storeStaffId: text("store_staff_id").notNull(),
	role: staffRole().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_store_staff_roles_staff").using("btree", table.storeStaffId.asc().nullsLast().op("text_ops")),
	uniqueIndex("store_staff_roles_staff_role_uq").using("btree", table.storeStaffId.asc().nullsLast().op("text_ops"), table.role.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storeStaffId],
			foreignColumns: [storeStaff.id],
			name: "store_staff_roles_store_staff_id_store_staff_id_fk"
		}).onDelete("cascade"),
]);

export const sellerAnnouncements = pgTable("seller_announcements", {
	id: text().primaryKey().notNull(),
	authorId: text("author_id").notNull(),
	rootStoreId: text("root_store_id").notNull(),
	scope: announcementScope().notNull(),
	targetStoreId: text("target_store_id"),
	title: varchar({ length: 200 }).notNull(),
	body: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_seller_ann_root").using("btree", table.rootStoreId.asc().nullsLast().op("text_ops")),
	index("idx_seller_ann_target").using("btree", table.targetStoreId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "seller_announcements_author_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.rootStoreId],
			foreignColumns: [stores.id],
			name: "seller_announcements_root_store_id_stores_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.targetStoreId],
			foreignColumns: [stores.id],
			name: "seller_announcements_target_store_id_stores_id_fk"
		}).onDelete("cascade"),
]);

export const rolePermissions = pgTable("role_permissions", {
	roleId: text("role_id").notNull(),
	permissionId: text("permission_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_role_permissions_role").using("btree", table.roleId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_permissions_role_id_roles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "role_permissions_permission_id_permissions_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.roleId, table.permissionId], name: "role_permissions_role_id_permission_id_pk"}),
]);

export const userRoles = pgTable("user_roles", {
	userId: text("user_id").notNull(),
	roleId: text("role_id").notNull(),
	tenantId: text("tenant_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_user_roles_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_user_roles_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_roles_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.roleId], name: "user_roles_user_id_role_id_pk"}),
]);

export const adSpendDaily = pgTable("ad_spend_daily", {
	date: varchar({ length: 10 }).notNull(),
	campaignId: text("campaign_id").notNull(),
	storeId: text("store_id").notNull(),
	totalSpend: numeric("total_spend", { precision: 10, scale:  4 }).default('0').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_spend_campaign").using("btree", table.campaignId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.date, table.campaignId], name: "ad_spend_daily_date_campaign_id_pk"}),
]);
