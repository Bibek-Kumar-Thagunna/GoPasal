import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { generateId } from "@/utils";

interface AuditEntry {
    actorId?: string;
    actorRole?: string;
    tenantId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    beforeState?: unknown;
    afterState?: unknown;
    metadata?: unknown;
    ipAddress?: string;
    requestId?: string;
}

export async function createAuditLog(
    entry: AuditEntry,
    tx: any = db
): Promise<void> {
    await tx.insert(auditLogs).values({
        id: generateId(),
        ...entry,
        // Ensure properties are compatible with JSONB or whatever DB expects
        beforeState: entry.beforeState,
        afterState: entry.afterState,
        metadata: entry.metadata,
    });
}
