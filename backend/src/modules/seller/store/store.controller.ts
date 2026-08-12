import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { storeService } from "./store.service";
import { AuthError, TenantError } from "@/utils/errors";
import { success, created } from "@/utils/response";
import { sellerPermissionService } from "@/modules/seller/permissions/seller-permission.service";

export const storeController = new Elysia({ prefix: "/api/v1/seller/stores" })
    .use(requireAuth())
    .post(
        "/",
        async ({ body, auth }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            const result = await storeService.createStore(auth.userId, body);
            return created(result);
        },
        {
            body: t.Object({
                name: t.String({ minLength: 3 }),
                slug: t.String({ minLength: 3, pattern: "^[a-z0-9-]+$" }),
                description: t.Optional(t.String()),
                shopType: t.Optional(t.String()),
                storeCategoryId: t.Optional(t.String()),
                deliveryType: t.Optional(t.String()),
                phone: t.Optional(t.String()),
                address: t.Optional(t.String()),
                latitude: t.Optional(t.Number()),
                longitude: t.Optional(t.Number()),
                parentStoreId: t.Optional(t.String()),
            }),
            detail: {
                tags: ["Seller"],
                summary: "Create a new store",
                description: "Promotes user to SELLER_OWNER and creates a store.",
            },
        }
    )
    .get(
        "/me",
        async ({ auth }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            const allStores = await storeService.listAccessibleStores(auth.userId);
            const store = await storeService.getMyStore(auth.userId, auth.tenantId);
            if (!store) {
                return success({
                    hasStore: false,
                    store: null,
                    stores: allStores,
                    permissions: [] as string[],
                    staffRoles: [] as string[],
                });
            }
            const entry = allStores.find((s) => s.id === store.id);
            const permissions = await sellerPermissionService.listEffectivePermissions(
                auth.userId,
                store.id
            );
            return success({
                hasStore: true,
                store,
                stores: allStores,
                activeStoreId: auth.tenantId ?? store.id,
                accessRole: entry?.accessRole ?? "OWNER",
                staffRoles: entry?.staffRoles ?? [],
                permissions,
            });
        },
        {
            detail: {
                tags: ["Seller"],
                summary: "Get my store",
            },
        }
    )
    .put(
        "/me",
        async ({ auth, body }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            const store = await storeService.getMyStore(auth.userId, auth.tenantId);
            if (!store) throw new AuthError("No store found for this user");
            const result = await storeService.updateStore(auth.userId, store.id, body);
            return success(result);
        },
        {
            body: t.Object({
                name: t.Optional(t.String({ minLength: 3 })),
                description: t.Optional(t.String()),
                shopType: t.Optional(t.String()),
                deliveryType: t.Optional(t.String()),
                phone: t.Optional(t.String()),
                address: t.Optional(t.String()),
                logoUrl: t.Optional(t.String()),
                bannerUrl: t.Optional(t.String()),
                deliveryRadius: t.Optional(t.Number({ minimum: 0.5, maximum: 50 })),
                latitude: t.Optional(t.Number({ minimum: -90, maximum: 90 })),
                longitude: t.Optional(t.Number({ minimum: -180, maximum: 180 })),
                deliveryFee: t.Optional(t.Number({ minimum: 0 })),
                freeDeliveryThreshold: t.Optional(t.Number({ minimum: 0 })),
                freeDelivery: t.Optional(t.Boolean()),
                clearDeliveryCharges: t.Optional(t.Boolean()),
            }),
            detail: {
                tags: ["Seller"],
                summary: "Update my store settings",
            },
        }
    )
    .post(
        "/onboarding/complete",
        async ({ auth }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            const result = await storeService.completeStoreOnboarding(auth.userId);
            return success(result);
        },
        {
            detail: {
                tags: ["Seller"],
                summary: "Mark post-approval store setup as complete",
            },
        }
    )
    // Store Categories
    .get(
        "/categories",
        async () => {
            const categories = await storeService.getStoreCategories();
            return success(categories);
        },
        {
            detail: {
                tags: ["Seller"],
                summary: "List all store categories",
            },
        }
    )
    .put(
        "/category",
        async ({ auth, body }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            const result = await storeService.setStoreCategory(auth.userId, body.storeCategoryId);
            return success(result);
        },
        {
            body: t.Object({
                storeCategoryId: t.String(),
            }),
            detail: {
                tags: ["Seller"],
                summary: "Set store category (business type)",
            },
        }
    )
    // KYC Flow
    .put(
        "/kyc/business-info",
        async ({ auth, body }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            const result = await storeService.submitKycBusinessInfo(auth.userId, body);
            return success(result);
        },
        {
            body: t.Object({
                businessName: t.String({ minLength: 2 }),
                panVat: t.String({ minLength: 3 }),
                address: t.String({ minLength: 5 }),
            }),
            detail: {
                tags: ["Seller"],
                summary: "Submit KYC business info (Step 1)",
            },
        }
    )
    .put(
        "/kyc/documents",
        async ({ auth, body }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            const result = await storeService.submitKycDocuments(auth.userId, body);
            return success(result);
        },
        {
            body: t.Object({
                kycDocumentUrl: t.Optional(t.String()),
                kycStoreLicenseUrl: t.Optional(t.String()),
            }),
            detail: {
                tags: ["Seller"],
                summary: "Submit KYC documents (Step 2)",
            },
        }
    )
    .put(
        "/kyc/photos",
        async ({ auth, body }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            const result = await storeService.submitKycPhotos(auth.userId, body.photoUrls);
            return success(result);
        },
        {
            body: t.Object({
                photoUrls: t.Array(t.String()),
            }),
            detail: {
                tags: ["Seller"],
                summary: "Submit KYC store photos (Step 2)",
            },
        }
    )
    .post(
        "/kyc/submit",
        async ({ auth }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            const result = await storeService.submitForReview(auth.userId);
            return success(result);
        },
        {
            detail: {
                tags: ["Seller"],
                summary: "Submit store for KYC review (Step 3)",
            },
        }
    )
    .get(
        "/verification-status",
        async ({ auth }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            const status = await storeService.getVerificationStatus(auth.userId);
            return success(status);
        },
        {
            detail: {
                tags: ["Seller"],
                summary: "Get current verification status",
            },
        }
    )
    // Quick Toggles
    .put(
        "/toggle/open",
        async ({ auth, body }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            if (!auth.tenantId) throw new TenantError("Tenant context required");
            await storeService.assertUserCanAccessStore(auth.userId, auth.tenantId);
            await sellerPermissionService.assertStorePermission(
                auth.userId,
                auth.tenantId,
                "store.operations"
            );
            const result = await storeService.toggleShopOpen({
                tenantId: auth.tenantId,
                userId: auth.userId,
                isOpen: body.isOpen,
            });
            return success(result);
        },
        {
            body: t.Object({ isOpen: t.Boolean() }),
            detail: {
                tags: ["Seller"],
                summary: "Toggle shop open/close",
            },
        }
    )
    .put(
        "/toggle/busy",
        async ({ auth, body }) => {
            if (!auth.userId) throw new AuthError("User ID required");
            if (!auth.tenantId) throw new TenantError("Tenant context required");
            await storeService.assertUserCanAccessStore(auth.userId, auth.tenantId);
            await sellerPermissionService.assertStorePermission(
                auth.userId,
                auth.tenantId,
                "store.operations"
            );
            const result = await storeService.toggleBusyMode({
                tenantId: auth.tenantId,
                userId: auth.userId,
                isBusy: body.isBusy,
                etaMinutes: body.etaMinutes,
            });
            return success(result);
        },
        {
            body: t.Object({
                isBusy: t.Boolean(),
                etaMinutes: t.Optional(t.Number()),
            }),
            detail: {
                tags: ["Seller"],
                summary: "Toggle busy mode with ETA",
            },
        }
    );

