import { Elysia } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { reviewService } from "./review.service";
import { success } from "@/utils/response";

export const reviewController = new Elysia({ prefix: "/api/v1/reviews" })
    // ─── Public Endpoints ────────────────────────────────────────
    .get("/product/:productId", async ({ params, query }) => {
        const page = Number((query as { page?: string }).page || 1);
        const rows = await reviewService.listProductReviews(params.productId, page);
        return success(rows);
    })
    .get("/store/:storeId", async ({ params, query }) => {
        const page = Number((query as { page?: string }).page || 1);
        const rows = await reviewService.listStoreReviews(params.storeId, page);
        return success(rows);
    })
    .get("/store/:storeId/rating", async ({ params }) => {
        const rating = await reviewService.getStoreRating(params.storeId);
        return success(rating);
    })

    // ─── Authenticated Endpoints ─────────────────────────────────
    .use(requireAuth())

    // Customer: Create review
    .post("/", async ({ body, auth }) => {
        const result = await reviewService.createReview(auth.userId, body as {
            orderId: string;
            productId: string;
            storeId: string;
            rating: number;
            comment?: string;
        });
        return success(result);
    })

    // Customer: Pending reviews (orders with no review yet)
    .get("/pending", async ({ auth }) => {
        const rows = await reviewService.listPendingReviews(auth.userId);
        return success(rows);
    })

    // Seller: Reply to a review
    .post("/:reviewId/reply", async ({ params, body, auth }) => {
        const { reply } = body as { reply: string };
        return await reviewService.addOwnerReply(
            params.reviewId,
            auth.userId,
            reply
        );
    })

    // Admin: List all reviews with optional filter
    .get("/admin/all", async ({ query }) => {
        const page = Number((query as { page?: string }).page || 1);
        const filter = (query as { filter?: string }).filter as "hidden" | "pending" | undefined;
        const rows = await reviewService.listAllReviews(page, 30, filter);
        return success(rows);
    })

    // Admin: Moderate review (hide/show/flag)
    .put("/:reviewId/moderate", async ({ params, body, auth }) => {
        const { action, note } = body as {
            action: "HIDE" | "SHOW" | "FLAG";
            note?: string;
        };
        const updated = await reviewService.moderateReview(
            params.reviewId,
            auth.userId,
            action,
            note
        );
        return success(updated);
    });
