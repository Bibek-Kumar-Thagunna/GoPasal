import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares";
import { success, created } from "@/utils/response";
import { invoiceService } from "./invoice.service";

export const invoiceController = new Elysia({ prefix: "/api/v1/invoices" })
    .use(requireAuth())
    .get(
        "/",
        async ({ auth }) => {
            const invoices = await invoiceService.listForSeller(auth.userId);
            return success(invoices);
        },
        {
            detail: { tags: ["Invoice"], summary: "List invoices for seller" },
        }
    )
    .get(
        "/:orderId",
        async ({ auth, params }) => {
            const invoice = await invoiceService.getByOrderId(params.orderId, auth.userId);
            return success(invoice);
        },
        {
            params: t.Object({ orderId: t.String() }),
            detail: { tags: ["Invoice"], summary: "Get invoice for order" },
        }
    )
    .post(
        "/:orderId/issue",
        async ({ auth, params }) => {
            await invoiceService.getByOrderId(params.orderId, auth.userId);
            const invoice = await invoiceService.issueInvoice(params.orderId);
            return created(invoice);
        },
        {
            params: t.Object({ orderId: t.String() }),
            detail: { tags: ["Invoice"], summary: "Issue invoice" },
        }
    );
