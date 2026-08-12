import { Elysia, t } from "elysia";
import { success } from "@/utils/response";
import { recommendationService } from "./recommendation.service";

export const analyticsController = new Elysia({ prefix: "/api/v1/analytics" })
    .get(
        "/trending",
        async () => {
            const products = await recommendationService.getTrending();
            return success(products);
        },
        {
            detail: { tags: ["Analytics"], summary: "Get trending products" },
        }
    )
    .get(
        "/recommendations/:productId",
        async ({ params }) => {
            const recommendations = await recommendationService.getRecommendations(params.productId);
            return success(recommendations);
        },
        {
            params: t.Object({ productId: t.String() }),
            detail: { tags: ["Analytics"], summary: "Get product recommendations" },
        }
    );
