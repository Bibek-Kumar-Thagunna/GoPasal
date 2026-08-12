import { Elysia } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { wishlistService } from "./wishlist.service";
import { success } from "@/utils/response";

export const wishlistController = new Elysia({ prefix: "/api/v1/wishlist" })
    .use(requireAuth())
    .get("/", async ({ auth }) => {
        const list = await wishlistService.listWishlist(auth.userId);
        return success(list);
    })
    .post("/toggle", async ({ body, auth }) => {
        const { productId } = body as any;
        const result = await wishlistService.toggleWishlist(auth.userId, productId);
        return success(result);
    });
