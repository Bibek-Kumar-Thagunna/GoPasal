import { relations } from "drizzle-orm/relations";
import { stores, storeMarketingSubscriptions, payments, paymentAttempts, orders, users, sessions, sellerPayoutRequests, products, productVariants, inventory, billingIntents, systemConfigs, addresses, riders, disputes, carts, cartItems, orderItems, deviceCredentials, userIdentities, groupOrderSplits, disputeMessages, masterProductTemplates, branchProductLinks, masterMerchants, riderTiers, flashSaleEvents, hotItemConfig, riderLeaderboards, riderPerformanceMonthly, sellerBadges, cartParticipants, escrow, ledgerAccounts, ledgerEntries, paymentRecords, refunds, settlements, settlementItems, predictiveAlerts, riderDeposits, tripTasks, posIntegrations, posOrderMappings, posProductMappings, posSyncLogs, invoices, invoiceLines, taxProfiles, wishlists, storeStaff, policies, userConsents, searchDocuments, searchEmbeddings, userSubscriptions, subscriptionPlans, productRecommendations, trendingProducts, supportConversations, supportActions, supportMessages, orderStatusHistory, deliveryTasks, reviews, categories, storeStaffRoles, sellerAnnouncements, roles, rolePermissions, permissions, userRoles } from "./schema";

export const storeMarketingSubscriptionsRelations = relations(storeMarketingSubscriptions, ({one}) => ({
	store: one(stores, {
		fields: [storeMarketingSubscriptions.storeId],
		references: [stores.id]
	}),
}));

export const storesRelations = relations(stores, ({one, many}) => ({
	storeMarketingSubscriptions: many(storeMarketingSubscriptions),
	sellerPayoutRequests: many(sellerPayoutRequests),
	billingIntents: many(billingIntents),
	carts: many(carts),
	sellerBadges: many(sellerBadges),
	escrows: many(escrow),
	settlements: many(settlements),
	posIntegrations: many(posIntegrations),
	posProductMappings: many(posProductMappings),
	posSyncLogs: many(posSyncLogs),
	invoices: many(invoices),
	taxProfiles: many(taxProfiles),
	storeStaffs: many(storeStaff),
	orders: many(orders),
	reviews: many(reviews),
	products: many(products),
	user: one(users, {
		fields: [stores.ownerId],
		references: [users.id]
	}),
	sellerAnnouncements_rootStoreId: many(sellerAnnouncements, {
		relationName: "sellerAnnouncements_rootStoreId_stores_id"
	}),
	sellerAnnouncements_targetStoreId: many(sellerAnnouncements, {
		relationName: "sellerAnnouncements_targetStoreId_stores_id"
	}),
}));

export const paymentAttemptsRelations = relations(paymentAttempts, ({one}) => ({
	payment: one(payments, {
		fields: [paymentAttempts.paymentId],
		references: [payments.id]
	}),
	order: one(orders, {
		fields: [paymentAttempts.orderId],
		references: [orders.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one, many}) => ({
	paymentAttempts: many(paymentAttempts),
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id]
	}),
	escrows: many(escrow),
	paymentRecords: many(paymentRecords),
	refunds: many(refunds),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	paymentAttempts: many(paymentAttempts),
	disputes: many(disputes),
	orderItems: many(orderItems),
	groupOrderSplits: many(groupOrderSplits),
	payments: many(payments),
	escrows: many(escrow),
	refunds: many(refunds),
	posOrderMappings: many(posOrderMappings),
	invoices: many(invoices),
	supportConversations: many(supportConversations),
	orderStatusHistories: many(orderStatusHistory),
	deliveryTasks: many(deliveryTasks),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	store: one(stores, {
		fields: [orders.storeId],
		references: [stores.id]
	}),
	address: one(addresses, {
		fields: [orders.deliveryAddressId],
		references: [addresses.id]
	}),
	reviews: many(reviews),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
	billingIntents: many(billingIntents),
	systemConfigs: many(systemConfigs),
	addresses: many(addresses),
	riders: many(riders),
	disputes_reporterId: many(disputes, {
		relationName: "disputes_reporterId_users_id"
	}),
	disputes_resolvedBy: many(disputes, {
		relationName: "disputes_resolvedBy_users_id"
	}),
	cartItems: many(cartItems),
	carts: many(carts),
	deviceCredentials: many(deviceCredentials),
	userIdentities: many(userIdentities),
	groupOrderSplits: many(groupOrderSplits),
	disputeMessages: many(disputeMessages),
	masterMerchants: many(masterMerchants),
	cartParticipants: many(cartParticipants),
	wishlists: many(wishlists),
	storeStaffs_userId: many(storeStaff, {
		relationName: "storeStaff_userId_users_id"
	}),
	storeStaffs_invitedBy: many(storeStaff, {
		relationName: "storeStaff_invitedBy_users_id"
	}),
	policies: many(policies),
	userConsents: many(userConsents),
	userSubscriptions: many(userSubscriptions),
	supportConversations: many(supportConversations),
	orders: many(orders),
	reviews_userId: many(reviews, {
		relationName: "reviews_userId_users_id"
	}),
	reviews_moderatedBy: many(reviews, {
		relationName: "reviews_moderatedBy_users_id"
	}),
	stores: many(stores),
	sellerAnnouncements: many(sellerAnnouncements),
	userRoles: many(userRoles),
}));

export const sellerPayoutRequestsRelations = relations(sellerPayoutRequests, ({one}) => ({
	store: one(stores, {
		fields: [sellerPayoutRequests.storeId],
		references: [stores.id]
	}),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
	inventories: many(inventory),
	cartItems: many(cartItems),
	orderItems: many(orderItems),
	hotItemConfigs: many(hotItemConfig),
	posProductMappings: many(posProductMappings),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	productVariants: many(productVariants),
	posProductMappings: many(posProductMappings),
	wishlists: many(wishlists),
	productRecommendations_sourceProductId: many(productRecommendations, {
		relationName: "productRecommendations_sourceProductId_products_id"
	}),
	productRecommendations_targetProductId: many(productRecommendations, {
		relationName: "productRecommendations_targetProductId_products_id"
	}),
	trendingProducts: many(trendingProducts),
	reviews: many(reviews),
	store: one(stores, {
		fields: [products.storeId],
		references: [stores.id]
	}),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
}));

export const inventoryRelations = relations(inventory, ({one}) => ({
	productVariant: one(productVariants, {
		fields: [inventory.variantId],
		references: [productVariants.id]
	}),
}));

export const billingIntentsRelations = relations(billingIntents, ({one}) => ({
	user: one(users, {
		fields: [billingIntents.payerUserId],
		references: [users.id]
	}),
	store: one(stores, {
		fields: [billingIntents.storeId],
		references: [stores.id]
	}),
}));

export const systemConfigsRelations = relations(systemConfigs, ({one}) => ({
	user: one(users, {
		fields: [systemConfigs.updatedBy],
		references: [users.id]
	}),
}));

export const addressesRelations = relations(addresses, ({one, many}) => ({
	user: one(users, {
		fields: [addresses.userId],
		references: [users.id]
	}),
	orders: many(orders),
}));

export const ridersRelations = relations(riders, ({one, many}) => ({
	user: one(users, {
		fields: [riders.userId],
		references: [users.id]
	}),
	riderTiers: many(riderTiers),
	riderLeaderboards: many(riderLeaderboards),
	riderPerformanceMonthlies: many(riderPerformanceMonthly),
	predictiveAlerts: many(predictiveAlerts),
	riderDeposits: many(riderDeposits),
	tripTasks: many(tripTasks),
	deliveryTasks: many(deliveryTasks),
}));

export const disputesRelations = relations(disputes, ({one, many}) => ({
	order: one(orders, {
		fields: [disputes.orderId],
		references: [orders.id]
	}),
	user_reporterId: one(users, {
		fields: [disputes.reporterId],
		references: [users.id],
		relationName: "disputes_reporterId_users_id"
	}),
	user_resolvedBy: one(users, {
		fields: [disputes.resolvedBy],
		references: [users.id],
		relationName: "disputes_resolvedBy_users_id"
	}),
	disputeMessages: many(disputeMessages),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
	productVariant: one(productVariants, {
		fields: [cartItems.variantId],
		references: [productVariants.id]
	}),
	user: one(users, {
		fields: [cartItems.addedBy],
		references: [users.id]
	}),
}));

export const cartsRelations = relations(carts, ({one, many}) => ({
	cartItems: many(cartItems),
	user: one(users, {
		fields: [carts.userId],
		references: [users.id]
	}),
	store: one(stores, {
		fields: [carts.storeId],
		references: [stores.id]
	}),
	cartParticipants: many(cartParticipants),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	productVariant: one(productVariants, {
		fields: [orderItems.variantId],
		references: [productVariants.id]
	}),
}));

export const deviceCredentialsRelations = relations(deviceCredentials, ({one}) => ({
	user: one(users, {
		fields: [deviceCredentials.userId],
		references: [users.id]
	}),
}));

export const userIdentitiesRelations = relations(userIdentities, ({one}) => ({
	user: one(users, {
		fields: [userIdentities.userId],
		references: [users.id]
	}),
}));

export const groupOrderSplitsRelations = relations(groupOrderSplits, ({one}) => ({
	order: one(orders, {
		fields: [groupOrderSplits.orderId],
		references: [orders.id]
	}),
	user: one(users, {
		fields: [groupOrderSplits.userId],
		references: [users.id]
	}),
}));

export const disputeMessagesRelations = relations(disputeMessages, ({one}) => ({
	dispute: one(disputes, {
		fields: [disputeMessages.disputeId],
		references: [disputes.id]
	}),
	user: one(users, {
		fields: [disputeMessages.senderId],
		references: [users.id]
	}),
}));

export const branchProductLinksRelations = relations(branchProductLinks, ({one}) => ({
	masterProductTemplate: one(masterProductTemplates, {
		fields: [branchProductLinks.templateId],
		references: [masterProductTemplates.id]
	}),
}));

export const masterProductTemplatesRelations = relations(masterProductTemplates, ({many}) => ({
	branchProductLinks: many(branchProductLinks),
}));

export const masterMerchantsRelations = relations(masterMerchants, ({one}) => ({
	user: one(users, {
		fields: [masterMerchants.ownerId],
		references: [users.id]
	}),
}));

export const riderTiersRelations = relations(riderTiers, ({one}) => ({
	rider: one(riders, {
		fields: [riderTiers.riderId],
		references: [riders.id]
	}),
}));

export const hotItemConfigRelations = relations(hotItemConfig, ({one}) => ({
	flashSaleEvent: one(flashSaleEvents, {
		fields: [hotItemConfig.eventId],
		references: [flashSaleEvents.id]
	}),
	productVariant: one(productVariants, {
		fields: [hotItemConfig.variantId],
		references: [productVariants.id]
	}),
}));

export const flashSaleEventsRelations = relations(flashSaleEvents, ({many}) => ({
	hotItemConfigs: many(hotItemConfig),
}));

export const riderLeaderboardsRelations = relations(riderLeaderboards, ({one}) => ({
	rider: one(riders, {
		fields: [riderLeaderboards.riderId],
		references: [riders.id]
	}),
}));

export const riderPerformanceMonthlyRelations = relations(riderPerformanceMonthly, ({one}) => ({
	rider: one(riders, {
		fields: [riderPerformanceMonthly.riderId],
		references: [riders.id]
	}),
}));

export const sellerBadgesRelations = relations(sellerBadges, ({one}) => ({
	store: one(stores, {
		fields: [sellerBadges.storeId],
		references: [stores.id]
	}),
}));

export const cartParticipantsRelations = relations(cartParticipants, ({one}) => ({
	cart: one(carts, {
		fields: [cartParticipants.cartId],
		references: [carts.id]
	}),
	user: one(users, {
		fields: [cartParticipants.userId],
		references: [users.id]
	}),
}));

export const escrowRelations = relations(escrow, ({one, many}) => ({
	payment: one(payments, {
		fields: [escrow.paymentId],
		references: [payments.id]
	}),
	order: one(orders, {
		fields: [escrow.orderId],
		references: [orders.id]
	}),
	store: one(stores, {
		fields: [escrow.tenantId],
		references: [stores.id]
	}),
	settlementItems: many(settlementItems),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({one}) => ({
	ledgerAccount: one(ledgerAccounts, {
		fields: [ledgerEntries.accountId],
		references: [ledgerAccounts.id]
	}),
}));

export const ledgerAccountsRelations = relations(ledgerAccounts, ({many}) => ({
	ledgerEntries: many(ledgerEntries),
}));

export const paymentRecordsRelations = relations(paymentRecords, ({one}) => ({
	payment: one(payments, {
		fields: [paymentRecords.paymentId],
		references: [payments.id]
	}),
}));

export const refundsRelations = relations(refunds, ({one}) => ({
	order: one(orders, {
		fields: [refunds.orderId],
		references: [orders.id]
	}),
	payment: one(payments, {
		fields: [refunds.paymentId],
		references: [payments.id]
	}),
}));

export const settlementsRelations = relations(settlements, ({one, many}) => ({
	store: one(stores, {
		fields: [settlements.storeId],
		references: [stores.id]
	}),
	settlementItems: many(settlementItems),
}));

export const settlementItemsRelations = relations(settlementItems, ({one}) => ({
	settlement: one(settlements, {
		fields: [settlementItems.settlementId],
		references: [settlements.id]
	}),
	escrow: one(escrow, {
		fields: [settlementItems.escrowId],
		references: [escrow.id]
	}),
}));

export const predictiveAlertsRelations = relations(predictiveAlerts, ({one}) => ({
	rider: one(riders, {
		fields: [predictiveAlerts.riderId],
		references: [riders.id]
	}),
}));

export const riderDepositsRelations = relations(riderDeposits, ({one}) => ({
	rider: one(riders, {
		fields: [riderDeposits.riderId],
		references: [riders.id]
	}),
}));

export const tripTasksRelations = relations(tripTasks, ({one}) => ({
	rider: one(riders, {
		fields: [tripTasks.riderId],
		references: [riders.id]
	}),
}));

export const posIntegrationsRelations = relations(posIntegrations, ({one}) => ({
	store: one(stores, {
		fields: [posIntegrations.storeId],
		references: [stores.id]
	}),
}));

export const posOrderMappingsRelations = relations(posOrderMappings, ({one}) => ({
	order: one(orders, {
		fields: [posOrderMappings.orderId],
		references: [orders.id]
	}),
}));

export const posProductMappingsRelations = relations(posProductMappings, ({one}) => ({
	store: one(stores, {
		fields: [posProductMappings.storeId],
		references: [stores.id]
	}),
	product: one(products, {
		fields: [posProductMappings.productId],
		references: [products.id]
	}),
	productVariant: one(productVariants, {
		fields: [posProductMappings.variantId],
		references: [productVariants.id]
	}),
}));

export const posSyncLogsRelations = relations(posSyncLogs, ({one}) => ({
	store: one(stores, {
		fields: [posSyncLogs.storeId],
		references: [stores.id]
	}),
}));

export const invoicesRelations = relations(invoices, ({one, many}) => ({
	order: one(orders, {
		fields: [invoices.orderId],
		references: [orders.id]
	}),
	store: one(stores, {
		fields: [invoices.storeId],
		references: [stores.id]
	}),
	invoiceLines: many(invoiceLines),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({one}) => ({
	invoice: one(invoices, {
		fields: [invoiceLines.invoiceId],
		references: [invoices.id]
	}),
}));

export const taxProfilesRelations = relations(taxProfiles, ({one}) => ({
	store: one(stores, {
		fields: [taxProfiles.storeId],
		references: [stores.id]
	}),
}));

export const wishlistsRelations = relations(wishlists, ({one}) => ({
	user: one(users, {
		fields: [wishlists.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [wishlists.productId],
		references: [products.id]
	}),
}));

export const storeStaffRelations = relations(storeStaff, ({one, many}) => ({
	store: one(stores, {
		fields: [storeStaff.storeId],
		references: [stores.id]
	}),
	user_userId: one(users, {
		fields: [storeStaff.userId],
		references: [users.id],
		relationName: "storeStaff_userId_users_id"
	}),
	user_invitedBy: one(users, {
		fields: [storeStaff.invitedBy],
		references: [users.id],
		relationName: "storeStaff_invitedBy_users_id"
	}),
	storeStaffRoles: many(storeStaffRoles),
}));

export const policiesRelations = relations(policies, ({one, many}) => ({
	user: one(users, {
		fields: [policies.createdBy],
		references: [users.id]
	}),
	userConsents: many(userConsents),
}));

export const userConsentsRelations = relations(userConsents, ({one}) => ({
	user: one(users, {
		fields: [userConsents.userId],
		references: [users.id]
	}),
	policy: one(policies, {
		fields: [userConsents.policyId],
		references: [policies.id]
	}),
}));

export const searchEmbeddingsRelations = relations(searchEmbeddings, ({one}) => ({
	searchDocument: one(searchDocuments, {
		fields: [searchEmbeddings.documentId],
		references: [searchDocuments.id]
	}),
}));

export const searchDocumentsRelations = relations(searchDocuments, ({many}) => ({
	searchEmbeddings: many(searchEmbeddings),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [userSubscriptions.userId],
		references: [users.id]
	}),
	subscriptionPlan: one(subscriptionPlans, {
		fields: [userSubscriptions.planId],
		references: [subscriptionPlans.id]
	}),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({many}) => ({
	userSubscriptions: many(userSubscriptions),
}));

export const productRecommendationsRelations = relations(productRecommendations, ({one}) => ({
	product_sourceProductId: one(products, {
		fields: [productRecommendations.sourceProductId],
		references: [products.id],
		relationName: "productRecommendations_sourceProductId_products_id"
	}),
	product_targetProductId: one(products, {
		fields: [productRecommendations.targetProductId],
		references: [products.id],
		relationName: "productRecommendations_targetProductId_products_id"
	}),
}));

export const trendingProductsRelations = relations(trendingProducts, ({one}) => ({
	product: one(products, {
		fields: [trendingProducts.productId],
		references: [products.id]
	}),
}));

export const supportConversationsRelations = relations(supportConversations, ({one, many}) => ({
	user: one(users, {
		fields: [supportConversations.userId],
		references: [users.id]
	}),
	order: one(orders, {
		fields: [supportConversations.orderId],
		references: [orders.id]
	}),
	supportActions: many(supportActions),
	supportMessages: many(supportMessages),
}));

export const supportActionsRelations = relations(supportActions, ({one}) => ({
	supportConversation: one(supportConversations, {
		fields: [supportActions.conversationId],
		references: [supportConversations.id]
	}),
}));

export const supportMessagesRelations = relations(supportMessages, ({one}) => ({
	supportConversation: one(supportConversations, {
		fields: [supportMessages.conversationId],
		references: [supportConversations.id]
	}),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({one}) => ({
	order: one(orders, {
		fields: [orderStatusHistory.orderId],
		references: [orders.id]
	}),
}));

export const deliveryTasksRelations = relations(deliveryTasks, ({one}) => ({
	rider: one(riders, {
		fields: [deliveryTasks.riderId],
		references: [riders.id]
	}),
	order: one(orders, {
		fields: [deliveryTasks.orderId],
		references: [orders.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	user_userId: one(users, {
		fields: [reviews.userId],
		references: [users.id],
		relationName: "reviews_userId_users_id"
	}),
	order: one(orders, {
		fields: [reviews.orderId],
		references: [orders.id]
	}),
	store: one(stores, {
		fields: [reviews.storeId],
		references: [stores.id]
	}),
	product: one(products, {
		fields: [reviews.productId],
		references: [products.id]
	}),
	user_moderatedBy: one(users, {
		fields: [reviews.moderatedBy],
		references: [users.id],
		relationName: "reviews_moderatedBy_users_id"
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	products: many(products),
}));

export const storeStaffRolesRelations = relations(storeStaffRoles, ({one}) => ({
	storeStaff: one(storeStaff, {
		fields: [storeStaffRoles.storeStaffId],
		references: [storeStaff.id]
	}),
}));

export const sellerAnnouncementsRelations = relations(sellerAnnouncements, ({one}) => ({
	user: one(users, {
		fields: [sellerAnnouncements.authorId],
		references: [users.id]
	}),
	store_rootStoreId: one(stores, {
		fields: [sellerAnnouncements.rootStoreId],
		references: [stores.id],
		relationName: "sellerAnnouncements_rootStoreId_stores_id"
	}),
	store_targetStoreId: one(stores, {
		fields: [sellerAnnouncements.targetStoreId],
		references: [stores.id],
		relationName: "sellerAnnouncements_targetStoreId_stores_id"
	}),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({one}) => ({
	role: one(roles, {
		fields: [rolePermissions.roleId],
		references: [roles.id]
	}),
	permission: one(permissions, {
		fields: [rolePermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	rolePermissions: many(rolePermissions),
	userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
}));