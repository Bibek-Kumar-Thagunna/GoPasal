import { describe, expect, it, spyOn, afterAll, mock } from "bun:test";
import { sellerPermissionService } from "@/modules/seller/permissions/seller-permission.service";
import { staffMayApplyOrderStatus } from "@/modules/seller/order/order.staff-status-policy";

describe("Seller RBAC permission matrix", () => {
    afterAll(() => {
        mock.restore();
    });

    it("gives the store owner every permission", async () => {
        spyOn(sellerPermissionService, "getMembershipContext").mockResolvedValue({
            isOwner: true,
            staffRoles: [],
        });
        const perms = await sellerPermissionService.listEffectivePermissions("u_owner", "s_1");
        expect(perms.length).toBeGreaterThan(10); // ALL_PERMS
        expect(perms).toContain("staff.manage");
        expect(perms).toContain("products.manage");
        expect(perms).toContain("promotions.manage");
    });

    it("MANAGER gets all permissions (full ops role)", async () => {
        spyOn(sellerPermissionService, "getMembershipContext").mockResolvedValue({
            isOwner: false,
            staffRoles: ["MANAGER"],
        });
        const perms = await sellerPermissionService.listEffectivePermissions("u_mgr", "s_1");
        expect(perms).toContain("staff.manage");
        expect(perms).toContain("reviews.manage");
    });

    it("CASHIER is limited to orders + view-only products", async () => {
        spyOn(sellerPermissionService, "getMembershipContext").mockResolvedValue({
            isOwner: false,
            staffRoles: ["CASHIER"],
        });
        const perms = await sellerPermissionService.listEffectivePermissions("u_cash", "s_1");
        expect(perms).toContain("orders.manage");
        expect(perms).not.toContain("products.manage");
        expect(perms).not.toContain("staff.manage");
    });

    it("PACKER cannot manage staff or products", async () => {
        spyOn(sellerPermissionService, "getMembershipContext").mockResolvedValue({
            isOwner: false,
            staffRoles: ["PACKER"],
        });
        const perms = await sellerPermissionService.listEffectivePermissions("u_pk", "s_1");
        expect(perms).toContain("orders.manage");
        expect(perms).not.toContain("staff.manage");
        expect(perms).not.toContain("products.manage");
    });

    it("DRIVER gets order ops + analytics, nothing else", async () => {
        spyOn(sellerPermissionService, "getMembershipContext").mockResolvedValue({
            isOwner: false,
            staffRoles: ["DRIVER"],
        });
        const perms = await sellerPermissionService.listEffectivePermissions("u_drv", "s_1");
        expect(perms).toContain("orders.manage");
        expect(perms).toContain("analytics.view");
        expect(perms).not.toContain("products.manage");
        expect(perms).not.toContain("staff.manage");
    });

    it("enforces order-status policy per role", () => {
        // PACKED is allowed for MANAGER/PACKER/CASHIER
        expect(staffMayApplyOrderStatus("PACKED", ["PACKER"], false)).toBe(true);
        expect(staffMayApplyOrderStatus("PACKED", ["CASHIER"], false)).toBe(true);
        // ACCEPTED is MANAGER/CASHIER only
        expect(staffMayApplyOrderStatus("ACCEPTED", ["CASHIER"], false)).toBe(true);
        expect(staffMayApplyOrderStatus("ACCEPTED", ["PACKER"], false)).toBe(false);
        expect(staffMayApplyOrderStatus("ACCEPTED", ["DRIVER"], false)).toBe(false);
        // Dispatch + delivery are DRIVER-eligible
        expect(staffMayApplyOrderStatus("OUT_FOR_DELIVERY", ["DRIVER"], false)).toBe(true);
        expect(staffMayApplyOrderStatus("DELIVERED", ["DRIVER"], false)).toBe(true);
        // Owners bypass the staff policy
        expect(staffMayApplyOrderStatus("ACCEPTED", [], true)).toBe(true);
    });
});
