import { db, type DbTransaction } from "@/db";
import { stores, roles, userRoles, storeCategories, storeStaff, products } from "@/db/schema";
import type { StaffRoleKind } from "@/db/schema/staff";
import { eq, and, isNull, count } from "drizzle-orm";
import { generateId, AuthError, NotFoundError, ConflictError } from "@/utils";
import { ForbiddenError } from "@/utils/errors";
import { createAuditLog } from "@/shared";
import { assertValidStoreDeliveryMode } from "@/modules/fulfillment/fulfillment";
import { featureFlagService } from "@/modules/admin/feature-flag.service";
import { PLATFORM_DELIVERY_FLAG_KEY } from "@/modules/config/platform-delivery";
import { ValidationError } from "@/utils/errors";
import { isStoreOnboardingComplete } from "@/modules/admin/store-governance.util";

export class StoreService {
    async assertUserCanAccessStore(userId: string, storeId: string) {
        if (!storeId?.trim()) {
            throw new ForbiddenError("Store context required");
        }
        const [owned] = await db
            .select()
            .from(stores)
            .where(and(eq(stores.id, storeId), eq(stores.ownerId, userId)))
            .limit(1);
        if (owned) return owned;

        const [staffRow] = await db
            .select()
            .from(storeStaff)
            .where(
                and(
                    eq(storeStaff.storeId, storeId),
                    eq(storeStaff.userId, userId),
                    eq(storeStaff.status, "ACTIVE")
                )
            )
            .limit(1);
        if (!staffRow) {
            throw new ForbiddenError("Access denied");
        }
        const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
        if (!store) throw new NotFoundError("Store not found");
        return store;
    }

    async assertOwner(userId: string, storeId: string) {
        const [owned] = await db
            .select()
            .from(stores)
            .where(and(eq(stores.id, storeId), eq(stores.ownerId, userId)))
            .limit(1);
        if (!owned) throw new ForbiddenError("Access denied");
        return owned;
    }

    async listAccessibleStores(userId: string) {
        const owned = await db.select().from(stores).where(eq(stores.ownerId, userId));
        const staffRows = await db.query.storeStaff.findMany({
            where: and(eq(storeStaff.userId, userId), eq(storeStaff.status, "ACTIVE")),
            with: { store: true, roles: true },
        });
        const byId = new Map<
            string,
            typeof stores.$inferSelect & {
                accessRole: "OWNER" | "STAFF";
                staffRole?: string;
                staffRoles?: StaffRoleKind[];
            }
        >();
        for (const s of owned) {
            byId.set(s.id, { ...s, accessRole: "OWNER" });
        }
        for (const row of staffRows) {
            if (row.store && !byId.has(row.store.id)) {
                const roleKinds = (row.roles ?? []).map((r) => r.role as StaffRoleKind);
                byId.set(row.store.id, {
                    ...row.store,
                    accessRole: "STAFF",
                    staffRoles: roleKinds,
                    staffRole: roleKinds[0],
                });
            }
        }
        return Array.from(byId.values());
    }

    async getPrimaryOwnedStore(userId: string) {
        const [root] = await db
            .select()
            .from(stores)
            .where(and(eq(stores.ownerId, userId), isNull(stores.parentStoreId)))
            .limit(1);
        if (root) return root;
        const [any] = await db.select().from(stores).where(eq(stores.ownerId, userId)).limit(1);
        return any ?? null;
    }

    async createStore(
        userId: string,
        data: {
            name: string;
            slug: string;
            description?: string;
            shopType?: string;
            storeCategoryId?: string;
            deliveryType?: string;
            phone?: string;
            address?: string;
            latitude?: number;
            longitude?: number;
            deliveryRadius?: number;
            parentStoreId?: string;
        }
    ) {
        if (!data.parentStoreId) {
            const [root] = await db
                .select()
                .from(stores)
                .where(and(eq(stores.ownerId, userId), isNull(stores.parentStoreId)))
                .limit(1);
            if (root) {
                throw new ConflictError(
                    "You already have a primary store. Pass parentStoreId to create a branch."
                );
            }
        } else {
            const [parent] = await db
                .select()
                .from(stores)
                .where(and(eq(stores.id, data.parentStoreId), eq(stores.ownerId, userId)))
                .limit(1);
            if (!parent) {
                throw new AuthError("Invalid parent store for branch");
            }
        }

        const existingSlug = await db
            .select()
            .from(stores)
            .where(eq(stores.slug, data.slug))
            .limit(1);

        if (existingSlug.length > 0) {
            throw new ConflictError("Store slug already taken");
        }

        const storeId = generateId();

        return await db.transaction(async (tx: DbTransaction) => {
            let verificationStep = "PENDING_INFO" as (typeof stores.$inferSelect)["verificationStep"];
            let status: (typeof stores.$inferSelect)["status"] = "PENDING";
            let kycStatus = "PENDING" as string;
            if (data.parentStoreId) {
                const [parent] = await tx
                    .select()
                    .from(stores)
                    .where(eq(stores.id, data.parentStoreId!))
                    .limit(1);
                if (parent?.verificationStep === "APPROVED" && parent.status === "ACTIVE") {
                    verificationStep = "APPROVED";
                    status = "ACTIVE";
                    kycStatus = "APPROVED";
                }
            }

            let deliveryType = "MERCHANT_SELF";
            if (data.deliveryType) {
                try {
                    deliveryType = assertValidStoreDeliveryMode(data.deliveryType);
                } catch {
                    throw new ValidationError(
                        "deliveryType must be MERCHANT_SELF, PLATFORM, PICKUP_ONLY, or HYBRID"
                    );
                }
            }

            const [newStore] = await tx
                .insert(stores)
                .values({
                    id: storeId,
                    ownerId: userId,
                    parentStoreId: data.parentStoreId ?? null,
                    name: data.name,
                    slug: data.slug,
                    description: data.description,
                    shopType: data.shopType || "GROCERY",
                    storeCategoryId: data.storeCategoryId,
                    deliveryType,
                    phone: data.phone,
                    address: data.address,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    deliveryRadius: data.deliveryRadius ?? 3,
                    status,
                    verificationStep,
                    kycStatus,
                    isOpen: status === "ACTIVE",
                })
                .returning();

            if (!data.parentStoreId) {
                const [sellerRole] = await tx
                    .select()
                    .from(roles)
                    .where(eq(roles.name, "SELLER_OWNER"));

                if (sellerRole) {
                    const existingRole = await tx
                        .select()
                        .from(userRoles)
                        .where(
                            and(
                                eq(userRoles.userId, userId),
                                eq(userRoles.roleId, sellerRole.id)
                            )
                        );

                    if (existingRole.length === 0) {
                        await tx.insert(userRoles).values({
                            userId,
                            roleId: sellerRole.id,
                            tenantId: storeId,
                        });
                    } else {
                        await tx
                            .update(userRoles)
                            .set({ tenantId: storeId })
                            .where(
                                and(
                                    eq(userRoles.userId, userId),
                                    eq(userRoles.roleId, sellerRole.id)
                                )
                            );
                    }
                }
            }

            await createAuditLog({
                actorId: userId,
                action: "CREATE",
                resource: "stores",
                resourceId: storeId,
                metadata: { payload: data },
            }, tx);

            return newStore;
        });
    }

    async getMyStore(userId: string, activeTenantId?: string | null) {
        if (activeTenantId) {
            try {
                return await this.assertUserCanAccessStore(userId, activeTenantId);
            } catch {
                return null;
            }
        }
        const list = await this.listAccessibleStores(userId);
        return list[0] ?? null;
    }

    async updateStore(
        userId: string,
        storeId: string,
        data: {
            name?: string;
            description?: string;
            shopType?: string;
            deliveryType?: string;
            phone?: string;
            address?: string;
            logoUrl?: string;
            bannerUrl?: string;
            deliveryRadius?: number;
            latitude?: number;
            longitude?: number;
            operatingHours?: object;
            kycDocumentUrl?: string;
            deliveryFee?: number;
            freeDeliveryThreshold?: number;
            freeDelivery?: boolean;
            clearDeliveryCharges?: boolean;
        }
    ) {
        const [store] = await db
            .select()
            .from(stores)
            .where(eq(stores.id, storeId));

        if (!store) {
            throw new NotFoundError("Store not found");
        }

        if (store.ownerId !== userId) {
            throw new ForbiddenError("Access denied");
        }

        const {
            deliveryFee,
            freeDeliveryThreshold,
            freeDelivery,
            clearDeliveryCharges,
            ...storeFields
        } = data;

        const updateData: Record<string, unknown> = { ...storeFields, updatedAt: new Date() };

        const hasDeliveryChargeUpdate =
            deliveryFee !== undefined ||
            freeDeliveryThreshold !== undefined ||
            freeDelivery !== undefined ||
            clearDeliveryCharges === true;

        if (hasDeliveryChargeUpdate) {
            const existing =
                store.metadata &&
                typeof store.metadata === "object" &&
                !Array.isArray(store.metadata)
                    ? { ...(store.metadata as Record<string, unknown>) }
                    : {};

            if (clearDeliveryCharges) {
                delete existing.deliveryFee;
                delete existing.freeDeliveryThreshold;
                delete existing.freeDelivery;
            } else if (freeDelivery === true) {
                existing.freeDelivery = true;
                existing.deliveryFee = 0;
                delete existing.freeDeliveryThreshold;
            } else {
                if (freeDelivery === false) {
                    existing.freeDelivery = false;
                }
                if (deliveryFee !== undefined) {
                    if (deliveryFee <= 0) {
                        delete existing.deliveryFee;
                    } else {
                        existing.deliveryFee = deliveryFee;
                        existing.freeDelivery = false;
                    }
                }
                if (freeDeliveryThreshold !== undefined) {
                    if (freeDeliveryThreshold <= 0) {
                        delete existing.freeDeliveryThreshold;
                    } else {
                        existing.freeDeliveryThreshold = freeDeliveryThreshold;
                    }
                }
            }

            updateData.metadata = existing;
        }

        if (data.latitude !== undefined) {
            if (data.latitude < -90 || data.latitude > 90) {
                throw new ValidationError("latitude must be between -90 and 90");
            }
        }
        if (data.longitude !== undefined) {
            if (data.longitude < -180 || data.longitude > 180) {
                throw new ValidationError("longitude must be between -180 and 180");
            }
        }
        if (data.deliveryRadius !== undefined) {
            if (data.deliveryRadius < 0.5 || data.deliveryRadius > 50) {
                throw new ValidationError("deliveryRadius must be between 0.5 and 50 km");
            }
        }

        if (data.deliveryType !== undefined) {
            try {
                const mode = assertValidStoreDeliveryMode(data.deliveryType);
                const platformOn = await featureFlagService.isEnabled(
                    PLATFORM_DELIVERY_FLAG_KEY
                );
                if (!platformOn && (mode === "PLATFORM" || mode === "HYBRID")) {
                    throw new ValidationError(
                        "GoPasal fleet delivery is not available yet. Choose merchant delivery or pickup."
                    );
                }
                updateData.deliveryType = mode;
            } catch (err) {
                if (err instanceof ValidationError) throw err;
                throw new ValidationError(
                    "deliveryType must be MERCHANT_SELF, PLATFORM, PICKUP_ONLY, or HYBRID"
                );
            }
        }
        if (data.kycDocumentUrl) updateData.kycStatus = "PENDING";

        const [updatedStore] = await db
            .update(stores)
            .set(updateData)
            .where(eq(stores.id, storeId))
            .returning();

        return updatedStore;
    }

    async setStoreCategory(userId: string, storeCategoryId: string) {
        const store = await this.getPrimaryOwnedStore(userId);
        if (!store) throw new NotFoundError("Store not found");
        if (store.ownerId !== userId) throw new AuthError("Not authorized");

        // Validate category exists
        const [category] = await db
            .select()
            .from(storeCategories)
            .where(eq(storeCategories.id, storeCategoryId));

        if (!category) throw new NotFoundError("Store category not found");

        const [updated] = await db
            .update(stores)
            .set({
                storeCategoryId,
                shopType: category.slug.toUpperCase(),
                updatedAt: new Date(),
            })
            .where(eq(stores.id, store.id))
            .returning();

        return updated;
    }

    async submitKycBusinessInfo(
        userId: string,
        data: { businessName: string; panVat: string; address: string }
    ) {
        const store = await this.getPrimaryOwnedStore(userId);
        if (!store) throw new NotFoundError("Store not found");
        if (store.ownerId !== userId) throw new ForbiddenError("Not authorized");

        const [updated] = await db
            .update(stores)
            .set({
                kycBusinessName: data.businessName,
                kycPanVat: data.panVat,
                kycAddress: data.address,
                verificationStep: "PENDING_DOCS",
                updatedAt: new Date(),
            })
            .where(eq(stores.id, store.id))
            .returning();

        return updated;
    }

    async submitKycDocuments(
        userId: string,
        data: { kycDocumentUrl?: string; kycStoreLicenseUrl?: string }
    ) {
        const store = await this.getPrimaryOwnedStore(userId);
        if (!store) throw new NotFoundError("Store not found");
        if (store.ownerId !== userId) throw new ForbiddenError("Not authorized");

        const updateData: any = { updatedAt: new Date() };
        if (data.kycDocumentUrl) updateData.kycDocumentUrl = data.kycDocumentUrl;
        if (data.kycStoreLicenseUrl) updateData.kycStoreLicenseUrl = data.kycStoreLicenseUrl;

        const [updated] = await db
            .update(stores)
            .set(updateData)
            .where(eq(stores.id, store.id))
            .returning();

        return updated;
    }

    async submitKycPhotos(userId: string, photoUrls: string[]) {
        const store = await this.getPrimaryOwnedStore(userId);
        if (!store) throw new NotFoundError("Store not found");
        if (store.ownerId !== userId) throw new ForbiddenError("Not authorized");

        const existingPhotos = (store.kycStorePhotos as string[]) || [];
        const allPhotos = [...existingPhotos, ...photoUrls];

        const [updated] = await db
            .update(stores)
            .set({
                kycStorePhotos: allPhotos,
                updatedAt: new Date(),
            })
            .where(eq(stores.id, store.id))
            .returning();

        return updated;
    }

    async submitForReview(userId: string) {
        const store = await this.getPrimaryOwnedStore(userId);
        if (!store) throw new NotFoundError("Store not found");
        if (store.ownerId !== userId) throw new ForbiddenError("Not authorized");

        // Validate required fields
        if (!store.kycBusinessName || !store.kycPanVat) {
            throw new ValidationError("Business info not complete");
        }

        const [updated] = await db
            .update(stores)
            .set({
                verificationStep: "UNDER_REVIEW",
                kycStatus: "PENDING",
                verificationSubmittedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(stores.id, store.id))
            .returning();

        await createAuditLog({
            actorId: userId,
            action: "SUBMIT",
            resource: "stores",
            resourceId: store.id,
            metadata: { action: "kyc_submit_for_review" },
        });

        return updated;
    }

    async getVerificationStatus(userId: string) {
        const store = await this.getPrimaryOwnedStore(userId);
        if (!store) return null;

        return {
            storeId: store.id,
            storeName: store.name,
            status: store.status,
            verificationStep: store.verificationStep,
            kycStatus: store.kycStatus,
            kycBusinessName: store.kycBusinessName,
            kycPanVat: store.kycPanVat,
            kycAddress: store.kycAddress,
            kycDocumentUrl: store.kycDocumentUrl,
            kycStoreLicenseUrl: store.kycStoreLicenseUrl,
            kycStorePhotos: store.kycStorePhotos,
            submittedAt: store.verificationSubmittedAt,
            reviewedAt: store.verificationReviewedAt,
            adminNotes: store.adminNotes,
            onboardingCompleted: isStoreOnboardingComplete(store.metadata),
            isOpen: store.isOpen,
            latitude: store.latitude,
            longitude: store.longitude,
            deliveryRadius: store.deliveryRadius,
        };
    }

    async completeStoreOnboarding(userId: string) {
        const store = await this.getPrimaryOwnedStore(userId);
        if (!store) throw new NotFoundError("Store not found");
        if (store.ownerId !== userId) throw new AuthError("Not authorized");

        if (store.verificationStep !== "APPROVED" && store.status !== "ACTIVE") {
            throw new ValidationError(
                "Your store must be approved before completing setup"
            );
        }

        const existingMeta =
            store.metadata && typeof store.metadata === "object"
                ? (store.metadata as Record<string, unknown>)
                : {};

        const [updated] = await db
            .update(stores)
            .set({
                metadata: {
                    ...existingMeta,
                    onboardingCompletedAt: new Date().toISOString(),
                },
                updatedAt: new Date(),
            })
            .where(eq(stores.id, store.id))
            .returning();

        await createAuditLog({
            actorId: userId,
            action: "UPDATE",
            resource: "stores",
            resourceId: store.id,
            metadata: { action: "onboarding_complete" },
        });

        return updated;
    }

    async getStoreCategories() {
        return await db
            .select()
            .from(storeCategories)
            .where(eq(storeCategories.isActive, true));
    }

    async toggleShopOpen(opts: {
        tenantId?: string | null;
        userId: string;
        isOpen: boolean;
    }) {
        const targetId =
            opts.tenantId ?? (await this.getPrimaryOwnedStore(opts.userId))?.id;
        if (!targetId) throw new NotFoundError("Store not found");
        const store = await this.assertUserCanAccessStore(opts.userId, targetId);

        if (opts.isOpen) {
            if (store.latitude == null || store.longitude == null || !store.deliveryRadius || Number(store.deliveryRadius) <= 0) {
                throw new ValidationError("Set your store delivery location pin and coverage radius before opening your shop for customer orders.");
            }
            const [prodCount] = await db
                .select({ count: count() })
                .from(products)
                .where(eq(products.storeId, store.id));
            if (Number(prodCount?.count ?? 0) < 1) {
                throw new ValidationError("Add at least 1 product to your store catalog before opening your shop for customer orders.");
            }
        }

        const [updated] = await db
            .update(stores)
            .set({ isOpen: opts.isOpen, updatedAt: new Date() })
            .where(eq(stores.id, store.id))
            .returning();

        return updated;
    }

    async toggleBusyMode(opts: {
        tenantId?: string | null;
        userId: string;
        isBusy: boolean;
        etaMinutes?: number;
    }) {
        const targetId =
            opts.tenantId ?? (await this.getPrimaryOwnedStore(opts.userId))?.id;
        if (!targetId) throw new NotFoundError("Store not found");
        const store = await this.assertUserCanAccessStore(opts.userId, targetId);

        const [updated] = await db
            .update(stores)
            .set({
                isBusyMode: opts.isBusy,
                busyModeEtaMinutes: opts.etaMinutes ?? null,
                updatedAt: new Date(),
            })
            .where(eq(stores.id, store.id))
            .returning();

        return updated;
    }

    async getRootStoreRowForStore(storeId: string) {
        if (!storeId?.trim()) {
            return null;
        }
        let cur = storeId;
        for (let i = 0; i < 32; i++) {
            const [s] = await db.select().from(stores).where(eq(stores.id, cur)).limit(1);
            if (!s) return null;
            if (!s.parentStoreId) return s;
            cur = s.parentStoreId;
        }
        return null;
    }

    async belongsToStoreTree(rootId: string, leafStoreId: string): Promise<boolean> {
        let cur: string | null = leafStoreId;
        for (let i = 0; i < 32; i++) {
            if (!cur) return false;
            if (cur === rootId) return true;
            const [s] = await db
                .select({ parentStoreId: stores.parentStoreId })
                .from(stores)
                .where(eq(stores.id, cur))
                .limit(1);
            if (!s) return false;
            cur = s.parentStoreId ?? null;
        }
        return false;
    }
}

export const storeService = new StoreService();

