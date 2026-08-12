import { Elysia, t } from "elysia";
import { success } from "@/utils/response";
import { searchService } from "./search.service";

export const searchController = new Elysia({ prefix: "/api/v1/search" })
    .get(
        "/",
        async ({ query }) => {
            const tenantId = query.tenantId ?? "default";
            const limit = query.limit ?? 20;
            const results = await searchService.semanticSearch(query.q, tenantId, limit);
            return success(results);
        },
        {
            query: t.Object({
                q: t.String(),
                tenantId: t.Optional(t.String()),
                limit: t.Optional(t.Number({ default: 20 })),
            }),
            detail: { tags: ["Search"], summary: "Search products and stores" },
        }
    )
    .get(
        "/suggestions",
        async ({ query }) => {
            const suggestions = await searchService.getSuggestions(query.q);
            return success(suggestions);
        },
        {
            query: t.Object({
                q: t.String(),
            }),
            detail: { tags: ["Search"], summary: "Get search suggestions/autocomplete" },
        }
    );
