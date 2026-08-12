import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares";
import { CustomerService } from "./customer.service";
import { success, created } from "@/utils/response";

const customerService = new CustomerService();

export const customerController = new Elysia({ prefix: "/api/v1" })
    .use(requireAuth())

    // --- Profile ---
    .get(
        "/profile",
        async ({ auth }) => {
            const profile = await customerService.getProfile(auth.userId);
            return success(profile);
        },
        {
            detail: { tags: ["Customer"], summary: "Get current user profile" },
        }
    )
    .put(
        "/profile",
        async ({ auth, body }) => {
            const updated = await customerService.updateProfile(auth.userId, body);
            return success(updated);
        },
        {
            body: t.Object({
                name: t.Optional(t.String()),
                email: t.Optional(t.String({ format: "email" })),
                avatarUrl: t.Optional(t.String()),
                pushToken: t.Optional(t.String()),
            }),
            detail: { tags: ["Customer"], summary: "Update profile" },
        }
    )

    // --- Addresses ---
    .get(
        "/addresses",
        async ({ auth }) => {
            const addresses = await customerService.listAddresses(auth.userId);
            return success(addresses);
        },
        {
            detail: { tags: ["Customer"], summary: "List saved addresses" },
        }
    )
    .post(
        "/addresses",
        async ({ auth, body, set }) => {
            const address = await customerService.addAddress(auth.userId, body);
            set.status = 201;
            return created(address);
        },
        {
            body: t.Object({
                label: t.String({ minLength: 1, maxLength: 50 }),
                addressLine: t.String({ minLength: 5 }),
                city: t.String(),
                landmark: t.Optional(t.String()),
                latitude: t.Number(),
                longitude: t.Number(),
                isDefault: t.Optional(t.Boolean()),
                contactName: t.Optional(t.String()),
                contactPhone: t.Optional(t.String()),
                buildingName: t.Optional(t.String()),
                floor: t.Optional(t.String()),
            }),
            detail: { tags: ["Customer"], summary: "Add new address" },
        }
    )
    .put(
        "/addresses/:id",
        async ({ auth, params, body }) => {
            const updated = await customerService.updateAddress(
                auth.userId,
                params.id,
                body
            );
            return success(updated);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                label: t.Optional(t.String()),
                addressLine: t.Optional(t.String()),
                city: t.Optional(t.String()),
                landmark: t.Optional(t.String()),
                latitude: t.Optional(t.Number()),
                longitude: t.Optional(t.Number()),
                isDefault: t.Optional(t.Boolean()),
                contactName: t.Optional(t.String()),
                contactPhone: t.Optional(t.String()),
                buildingName: t.Optional(t.String()),
                floor: t.Optional(t.String()),
            }),
            detail: { tags: ["Customer"], summary: "Update address" },
        }
    )
    .delete(
        "/addresses/:id",
        async ({ auth, params }) => {
            await customerService.deleteAddress(auth.userId, params.id);
            return success({ message: "Address deleted" });
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Customer"], summary: "Delete address" },
        }
    );
