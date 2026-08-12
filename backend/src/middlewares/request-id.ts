import { Elysia } from "elysia";

export const requestId = new Elysia({ name: "request-id" }).derive(
    { as: "global" },
    ({ request }) => {
        const id =
            request.headers.get("x-request-id") || crypto.randomUUID();
        return { requestId: id };
    }
);
