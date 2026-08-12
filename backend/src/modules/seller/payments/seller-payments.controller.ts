import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { success } from "@/utils/response";
import { sellerWalletService } from "@/modules/payment/seller-wallet.service";

export const sellerPaymentsController = new Elysia({
    prefix: "/api/v1/seller/payments",
})
    .group("", (app) =>
        app
        .use(requireAuth())
        .use(requireTenant())
        .get(
            "/wallet",
            async ({ tenantId }) => {
                const balances = await sellerWalletService.getBalances(tenantId!);
                return success(balances);
            },
            {
                detail: {
                    tags: ["Seller - Payments"],
                    summary: "Escrow, pending, and available balances (ledger-backed)",
                },
            }
        )
        .get(
            "/settlements",
            async ({ tenantId, query }) => {
                const limit = query.limit ? parseInt(query.limit, 10) : 20;
                const rows = await sellerWalletService.listPayoutHistory(tenantId!, limit);
                return success(rows);
            },
            {
                query: t.Object({ limit: t.Optional(t.String()) }),
                detail: {
                    tags: ["Seller - Payments"],
                    summary: "Settlement / payout batch history",
                },
            }
        )
    );
