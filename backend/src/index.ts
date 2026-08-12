import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { APP } from "@/config";
import { requestId, errorHandler } from "@/middlewares";
import { env } from "@/config";
import { rateLimit } from "@/middlewares/rate-limit";
import { securityHeaders } from "@/middlewares/security-headers";

// Module Imports
import { healthController } from "@/modules/health";
import { authController } from "@/modules/auth";
import { rbacController } from "@/modules/rbac";
import { customerController } from "@/modules/customer";
import { catalogController } from "@/modules/catalog";
import { cartController } from "@/modules/cart";
import { orderController } from "@/modules/order";
import { storeController } from "@/modules/seller/store";
import { productController } from "@/modules/seller/product";
import { sellerOrderController } from "@/modules/seller/order";
import { deliveryController } from "@/modules/delivery";
import {
  adminTenantController,
  adminConfigController,
  adminAuthController,
  adminGovernanceController,
} from "@/modules/admin";
import { disputeController, adminDisputeController } from "@/modules/support";
import { supportController } from "@/modules/support/support.controller";
import { adminAnalyticsController } from "@/modules/admin/analytics/analytics.controller";
import { notificationController } from "@/modules/customer/notification.controller";
import { sellerStatsController } from "@/modules/seller/stats/stats.controller";
import { paymentController } from "@/modules/payment/payment.controller";
import { customerPaymentController } from "@/modules/payment/customer-payment.controller";
import { billingController } from "@/modules/payment/billing.controller";
import { paymentWebhookController } from "@/modules/payment/payment-webhook.controller";
import { sellerPaymentsController } from "@/modules/seller/payments/seller-payments.controller";
import { reviewController } from "@/modules/review/review.controller";
import { wishlistController } from "@/modules/wishlist/wishlist.controller";
import { staffController } from "@/modules/seller/staff/staff.controller";
import { sellerAnnouncementController } from "@/modules/seller/announcement/seller-announcement.controller";
import { posController } from "@/modules/pos/pos.controller";
import { policyController } from "@/modules/policy/policy.controller";
import { enterpriseController } from "@/modules/enterprise/enterprise.controller";
import { growthController } from "@/modules/growth/growth.controller";
import { customerOffersController } from "@/modules/growth/customer-offers.controller";
import { adminNotificationsController } from "@/modules/admin/notifications/admin-notifications.controller";
import { modernAuthController } from "@/modules/auth/modern-auth.controller";
import { sellerAuthController } from "@/modules/auth/seller-auth.controller";
import { analyticsController } from "@/modules/analytics/controller";
import { searchController } from "@/modules/search/search.controller";
import { adController } from "@/modules/adtech/ad.controller";
import { logisticsController } from "@/modules/logistics/logistics.controller";
import { reorderController } from "@/modules/order/reorder.controller";
import { smartReorderController } from "@/modules/order/smart-reorder.controller";
import { flashSaleController } from "@/modules/flash_sale/flash-sale.controller";
import { groupOrderController } from "@/modules/group-order/group-order.controller";
import { gamificationController } from "@/modules/gamification/gamification.controller";
import { invoiceController } from "@/modules/invoice/invoice.controller";
import { monitoringController } from "@/modules/monitoring/monitoring.controller";
import { publicConfigController } from "@/modules/config/public-config.controller";
import { adminFeatureFlagController } from "@/modules/admin/feature-flag/admin-feature-flag.controller";
import { sellerCustomersController } from "@/modules/seller/insights/seller-customers.controller";
import { sellerEarningsController } from "@/modules/seller/insights/seller-earnings.controller";
import { sellerCouponsController } from "@/modules/seller/coupons/seller-coupons.controller";
import { sellerStoreMarketingController } from "@/modules/seller/store-marketing/seller-store-marketing.controller";
import { adminTiersController } from "@/modules/admin/admin-tiers.controller";
import { sellerMediaController } from "@/modules/seller/media/seller-media.controller";
import { adminUsersController } from "@/modules/admin/users/admin-users.controller";
import { adminOrdersController } from "@/modules/admin/orders/admin-orders.controller";
import { adminProductsController } from "@/modules/admin/products/admin-products.controller";
import { adminPromotionsController } from "@/modules/admin/promotions/admin-promotions.controller";
import { adminDeliveryOpsController } from "@/modules/admin/delivery/admin-delivery.controller";

import "@/cron/order-timeout"; // Initialize the order auto-cancel job
import "@/cron/payment-reconciliation"; // Initialize the payment reconciliation job

const allowedOrigins = env.ALLOWED_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return true;
  if (env.NODE_ENV !== "production") return true;

  const normalized = origin.trim().replace(/\/$/, "").toLowerCase();
  
  // Explicit matches in configured ALLOWED_ORIGINS
  if (allowedOrigins.some((allowed) => normalized === allowed.toLowerCase().replace(/\/$/, ""))) {
    return true;
  }

  // Allow all official GoPasal domains and subdomains
  if (
    normalized === "https://gopasal.com" ||
    normalized === "https://www.gopasal.com" ||
    normalized === "https://seller.gopasal.com" ||
    normalized === "https://admin.gopasal.com" ||
    normalized === "https://api.gopasal.com" ||
    normalized.endsWith(".gopasal.com") ||
    normalized.startsWith("http://localhost:") ||
    normalized.startsWith("http://127.0.0.1:")
  ) {
    return true;
  }

  return false;
};

const app = new Elysia()
  // Global plugins
  .use(
    cors({
      origin: (request: Request) => {
        const origin = request.headers.get("origin");
        return isAllowedOrigin(origin);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-ID",
        "X-Device-ID",
        "X-Requested-With",
        "Accept",
        "Origin",
        "x-seller-id",
        "x-tenant-id",
        "x-client-platform",
      ],
      exposeHeaders: ["Content-Range", "X-Total-Count", "X-Request-ID"],
      maxAge: 86400,
    })
  )
  .use(securityHeaders)
  .use(rateLimit({ max: env.RATE_LIMIT_MAX, windowMs: env.RATE_LIMIT_WINDOW_MS, prefix: "global" }))
  .use(
    swagger({
      documentation: {
        info: {
          title: APP.NAME,
          version: APP.VERSION,
          description:
            "GoPasal Backend API — Multi-tenant hyperlocal commerce platform",
        },
        tags: [
          { name: "Health", description: "Health check endpoints" },
          { name: "Auth", description: "Authentication endpoints" },
          { name: "RBAC", description: "Role-based access control management" },
          {
            name: "Customer",
            description: "Customer profile and address management",
          },
          { name: "Catalog", description: "Store and product discovery" },
          { name: "Cart", description: "Shopping cart management" },
          { name: "Order", description: "Order placement and history" },
          { name: "Seller", description: "Seller store management" },
          { name: "Seller - Product", description: "Seller product CRUD" },
          { name: "Seller - Order", description: "Seller order management" },
          { name: "Delivery", description: "Rider and delivery task management" },
          { name: "Support", description: "Customer support and disputes" },
          { name: "Admin - Tenant", description: "Platform tenant administration" },
          { name: "Admin - Config", description: "System configuration" },
          { name: "Admin - Support", description: "Admin dispute resolution" },
          { name: "Admin - Analytics", description: "Platform analytics and reporting" },
          { name: "Notifications", description: "User notifications" },
        ],
      },
      path: "/docs",
    })
  )

  // Global middlewares
  .use(requestId)
  .use(errorHandler)

  // Modules
  .use(healthController)
  .use(publicConfigController)
  .use(adminAuthController)
  .use(authController)
  .use(modernAuthController)
  .use(sellerAuthController)
  .use(rbacController)
  .use(customerController)
  .use(catalogController)
  .use(cartController)
  .use(orderController)
  .use(storeController)
  .use(productController)
  .use(sellerMediaController)
  .use(sellerOrderController)
  .use(deliveryController)
  .use(adminTenantController)
  .use(adminGovernanceController)
  .use(adminConfigController)
  .use(adminFeatureFlagController)
  .use(disputeController)
  .use(supportController)
  .use(adminTiersController)
  .use(adminUsersController)
  .use(adminOrdersController)
  .use(adminProductsController)
  .use(adminPromotionsController)
  .use(adminDeliveryOpsController)
  .use(adminDisputeController)
  .use(adminAnalyticsController)
  .use(notificationController)
  .use(sellerStatsController)
  .use(sellerCustomersController)
  .use(sellerEarningsController)
  .use(sellerCouponsController)
  .use(sellerStoreMarketingController)
  .use(paymentController)
  .use(customerPaymentController)
  .use(billingController)
  .use(paymentWebhookController)
  .use(sellerPaymentsController)
  .use(reviewController)
  .use(wishlistController)
  .use(staffController)
  .use(sellerAnnouncementController)
  .use(posController)
  .use(policyController)
  .use(enterpriseController)
  .use(growthController)
  .use(customerOffersController)
  .use(adminNotificationsController)
  .use(analyticsController)
  .use(searchController)
  .use(adController)
  .use(reorderController)
  .use(smartReorderController)
  .use(flashSaleController)
  .use(groupOrderController)
  .use(gamificationController)
  .use(logisticsController)
  .use(invoiceController)
  .use(monitoringController)

  // Start server
  .listen({ port: env.PORT, hostname: "0.0.0.0" });

console.log(
  `🦊 ${APP.NAME} v${APP.VERSION} is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
