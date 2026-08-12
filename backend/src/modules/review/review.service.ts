import { db } from "@/db";
import { reviews, stores, orders } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { generateId, NotFoundError } from "@/utils";
import { storeService } from "@/modules/seller/store/store.service";
import { sellerPermissionService } from "@/modules/seller/permissions/seller-permission.service";

export class ReviewService {
    // ─── Create Review ───────────────────────────────────────────
    async createReview(
        userId: string,
        data: {
            orderId: string;
            productId: string;
            storeId: string;
            rating: number;
            comment?: string;
        }
    ) {
        if (data.rating < 1 || data.rating > 5) {
            throw new Error("Rating must be between 1 and 5");
        }

        const reviewId = generateId();
        await db.insert(reviews).values({
            id: reviewId,
            userId,
            ...data,
            isVerifiedPurchase: true,
        });

        return { success: true, reviewId };
    }

    // ─── List Product Reviews ────────────────────────────────────
    async listProductReviews(productId: string, page = 1, limit = 20) {
        return await db.query.reviews.findMany({
            where: and(
                eq(reviews.productId, productId),
                eq(reviews.isHidden, false)
            ),
            limit,
            offset: (page - 1) * limit,
            with: { user: true },
            orderBy: desc(reviews.createdAt),
        });
    }

    // ─── List Store Reviews ──────────────────────────────────────
    async listStoreReviews(storeId: string, page = 1, limit = 20) {
        return await db.query.reviews.findMany({
            where: and(
                eq(reviews.storeId, storeId),
                eq(reviews.isHidden, false)
            ),
            limit,
            offset: (page - 1) * limit,
            with: { user: true },
            orderBy: desc(reviews.createdAt),
        });
    }

    // ─── Get Store Rating ────────────────────────────────────────
    async getStoreRating(storeId: string) {
        const [result] = await db
            .select({
                avgRating: sql<number>`avg(${reviews.rating})`,
                count: sql<number>`count(*)`,
            })
            .from(reviews)
            .where(and(eq(reviews.storeId, storeId), eq(reviews.isHidden, false)));

        return {
            rating: Number(result?.avgRating || 0).toFixed(1),
            count: Number(result?.count || 0),
        };
    }

    // ─── Owner Reply ─────────────────────────────────────────────
    async addOwnerReply(reviewId: string, actorUserId: string, reply: string) {
        const [review] = await db
            .select()
            .from(reviews)
            .where(eq(reviews.id, reviewId));

        if (!review) throw new NotFoundError("Review not found");

        const [store] = await db
            .select()
            .from(stores)
            .where(eq(stores.id, review.storeId))
            .limit(1);

        if (!store) throw new NotFoundError("Review not found");

        if (store.ownerId === actorUserId) {
            // owner may always reply
        } else {
            await storeService.assertUserCanAccessStore(actorUserId, review.storeId);
            await sellerPermissionService.assertStorePermission(
                actorUserId,
                review.storeId,
                "reviews.manage"
            );
        }

        const [updated] = await db
            .update(reviews)
            .set({
                ownerReply: reply,
                ownerRepliedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(reviews.id, reviewId))
            .returning();

        return updated;
    }

    // ─── Pending Reviews (orders without review) ─────────────────
    async listPendingReviews(userId: string) {
        // Find delivered orders by user that have no review yet
        const deliveredOrders = await db.query.orders.findMany({
            where: and(
                eq(orders.userId, userId),
                eq(orders.status, "DELIVERED")
            ),
            with: { items: { with: { variant: { with: { product: true } } } } },
        });

        // Filter orders that do not have a review
        const reviewedOrderIds = await db
            .select({ orderId: reviews.orderId })
            .from(reviews)
            .where(eq(reviews.userId, userId));

        const reviewedSet = new Set(reviewedOrderIds.map((r) => r.orderId));

        return deliveredOrders.filter((o) => !reviewedSet.has(o.id));
    }

    // ─── Admin: Moderate Review ──────────────────────────────────
    async moderateReview(
        reviewId: string,
        adminId: string,
        action: "HIDE" | "SHOW" | "FLAG",
        note?: string
    ) {
        const [review] = await db
            .select()
            .from(reviews)
            .where(eq(reviews.id, reviewId));

        if (!review) throw new NotFoundError("Review not found");

        const isHidden = action === "HIDE";

        const [updated] = await db
            .update(reviews)
            .set({
                isHidden,
                isModerated: true,
                moderatorNote: note,
                moderatedBy: adminId,
                moderatedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(reviews.id, reviewId))
            .returning();

        return updated;
    }

    // ─── List All Reviews (Admin) ────────────────────────────────
    async listAllReviews(page = 1, limit = 30, filter?: "hidden" | "pending") {
        const conditions = filter === "hidden"
            ? eq(reviews.isHidden, true)
            : filter === "pending"
            ? and(eq(reviews.isModerated, false), eq(reviews.isHidden, false))
            : undefined;

        return await db.query.reviews.findMany({
            where: conditions,
            limit,
            offset: (page - 1) * limit,
            with: { user: true, product: true, store: true },
            orderBy: desc(reviews.createdAt),
        });
    }
}

export const reviewService = new ReviewService();
