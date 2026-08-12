import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireSellerPrincipal } from "@/middlewares/seller-store-permission";
import { staffService } from "./staff.service";
import { storeService } from "../store/store.service";
import { sellerPermissionService } from "../permissions/seller-permission.service";
import { success } from "@/utils/response";

const staffRoleBody = t.Union([
    t.Literal("MANAGER"),
    t.Literal("CASHIER"),
    t.Literal("PACKER"),
    t.Literal("DRIVER"),
]);

export const staffController = new Elysia({ prefix: "/api/v1/seller/staff" })
    .use(requireAuth())
    .use(requireSellerPrincipal())
    .get("/:storeId", async ({ params, auth }) => {
        await storeService.assertUserCanAccessStore(auth.userId!, params.storeId);
        await sellerPermissionService.assertStorePermission(
            auth.userId!,
            params.storeId,
            "staff.manage"
        );
        const list = await staffService.listStaff(params.storeId);
        return success(list);
    })
    .post(
        "/:storeId/invite",
        async ({ params, body, auth }) => {
            await storeService.assertUserCanAccessStore(auth.userId!, params.storeId);
            await sellerPermissionService.assertStorePermission(
                auth.userId!,
                params.storeId,
                "staff.manage"
            );
            const result = await staffService.inviteStaff(
                params.storeId,
                body.phone,
                body.roles as ("MANAGER" | "CASHIER" | "PACKER" | "DRIVER")[],
                auth.userId!
            );
            return success(result);
        },
        {
            params: t.Object({ storeId: t.String() }),
            body: t.Object({
                phone: t.String({ minLength: 7, maxLength: 20 }),
                roles: t.Array(staffRoleBody, { minItems: 1 }),
            }),
        }
    )
    .put(
        "/:storeId/:staffId/roles",
        async ({ params, body, auth }) => {
            await storeService.assertUserCanAccessStore(auth.userId!, params.storeId);
            await sellerPermissionService.assertStorePermission(
                auth.userId!,
                params.storeId,
                "staff.manage"
            );
            const result = await staffService.setStaffRoles(
                params.storeId,
                params.staffId,
                body.roles as ("MANAGER" | "CASHIER" | "PACKER" | "DRIVER")[]
            );
            return success(result);
        },
        {
            params: t.Object({ storeId: t.String(), staffId: t.String() }),
            body: t.Object({
                roles: t.Array(staffRoleBody, { minItems: 1 }),
            }),
        }
    )
    .delete("/:storeId/:staffId", async ({ params, auth }) => {
        await storeService.assertUserCanAccessStore(auth.userId!, params.storeId);
        await sellerPermissionService.assertStorePermission(
            auth.userId!,
            params.storeId,
            "staff.manage"
        );
        const result = await staffService.removeStaff(params.storeId, params.staffId);
        return success(result);
    });
