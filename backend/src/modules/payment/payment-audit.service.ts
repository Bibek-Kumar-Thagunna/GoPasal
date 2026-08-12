import { db } from "@/db";
import { paymentAuditLogs } from "@/db/schema";
import { generateId } from "@/utils";

export class PaymentAuditService {
    async log(input: {
        action: string;
        actorType: "CUSTOMER" | "SELLER" | "ADMIN" | "SYSTEM" | "WEBHOOK";
        actorId?: string;
        orderId?: string;
        paymentId?: string;
        metadata?: Record<string, unknown>;
    }) {
        await db.insert(paymentAuditLogs).values({
            id: generateId(),
            action: input.action,
            actorType: input.actorType,
            actorId: input.actorId ?? null,
            orderId: input.orderId ?? null,
            paymentId: input.paymentId ?? null,
            metadata: input.metadata ?? null,
        });
    }
}

export const paymentAuditService = new PaymentAuditService();
