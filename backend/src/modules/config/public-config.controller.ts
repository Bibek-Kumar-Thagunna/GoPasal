import { Elysia } from "elysia";
import { featureFlagService } from "@/modules/admin/feature-flag.service";
import { PLATFORM_DELIVERY_FLAG_KEY } from "./platform-delivery";
import { success } from "@/utils/response";

export const publicConfigController = new Elysia({ prefix: "/api/v1/config" }).get(
    "/public",
    async () => {
        const platformDeliveryEnabled = await featureFlagService.isEnabled(
            PLATFORM_DELIVERY_FLAG_KEY
        );
        return success({
            platformDeliveryEnabled,
        });
    },
    {
        detail: {
            tags: ["Config"],
            summary: "Public client configuration (no auth)",
        },
    }
);
