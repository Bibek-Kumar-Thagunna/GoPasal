import { db } from "@/db";
import { sellerAnnouncements } from "@/db/schema";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import { generateId, ForbiddenError, ValidationError } from "@/utils";
import { storeService } from "../store/store.service";

export type AnnouncementScope = "SINGLE_STORE" | "ALL_BRANCHES";

export class SellerAnnouncementService {
    async listForStore(viewerUserId: string, storeId: string) {
        await storeService.assertUserCanAccessStore(viewerUserId, storeId);
        const root = await storeService.getRootStoreRowForStore(storeId);
        if (!root) throw new ForbiddenError("Access denied");

        const rows = await db.query.sellerAnnouncements.findMany({
            where: and(
                eq(sellerAnnouncements.rootStoreId, root.id),
                or(
                    and(
                        eq(sellerAnnouncements.scope, "ALL_BRANCHES"),
                        isNull(sellerAnnouncements.targetStoreId)
                    ),
                    and(
                        eq(sellerAnnouncements.scope, "SINGLE_STORE"),
                        eq(sellerAnnouncements.targetStoreId, storeId)
                    )
                )
            ),
            orderBy: desc(sellerAnnouncements.createdAt),
            limit: 100,
        });

        return rows;
    }

    async create(opts: {
        authorId: string;
        tenantStoreId: string;
        scope: AnnouncementScope;
        title: string;
        body: string;
        targetStoreId?: string | null;
    }) {
        const { authorId, tenantStoreId, scope, title, body } = opts;
        await storeService.assertUserCanAccessStore(authorId, tenantStoreId);

        const root = await storeService.getRootStoreRowForStore(tenantStoreId);
        if (!root) throw new ForbiddenError("Access denied");

        let targetStoreId: string | null = null;

        if (scope === "SINGLE_STORE") {
            const target = opts.targetStoreId ?? tenantStoreId;
            const ok = await storeService.belongsToStoreTree(root.id, target);
            if (!ok) throw new ForbiddenError("Access denied");
            await storeService.assertUserCanAccessStore(authorId, target);
            targetStoreId = target;
        } else {
            if (opts.targetStoreId) {
                throw new ValidationError("Branch-specific target is not used for org-wide notices");
            }
            targetStoreId = null;
        }

        const id = generateId();
        const [created] = await db
            .insert(sellerAnnouncements)
            .values({
                id,
                authorId,
                rootStoreId: root.id,
                scope,
                targetStoreId,
                title: title.slice(0, 200),
                body,
            })
            .returning();

        return created;
    }
}

export const sellerAnnouncementService = new SellerAnnouncementService();
