import { db, type DbTransaction } from "@/db";
import { codRecords, deliveryTasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/utils";

type RecordCodInput = {
    deliveryTaskId: string;
    orderId: string;
    riderId: string;
    expectedAmount: number;
    collectedAmount: number;
};

export async function recordCodCollection(
    input: RecordCodInput,
    executor: DbTransaction | typeof db = db
) {
    const [existing] = await executor
        .select({ id: codRecords.id })
        .from(codRecords)
        .where(eq(codRecords.deliveryTaskId, input.deliveryTaskId))
        .limit(1);

    if (existing) return existing;

    const status =
        Math.abs(input.collectedAmount - input.expectedAmount) < 0.01
            ? "MATCH"
            : "MISMATCH";

    const [row] = await executor
        .insert(codRecords)
        .values({
            id: generateId(),
            deliveryTaskId: input.deliveryTaskId,
            orderId: input.orderId,
            riderId: input.riderId,
            expectedAmount: String(input.expectedAmount),
            collectedAmount: String(input.collectedAmount),
            status,
            isReconciled: false,
        })
        .returning();

    await executor
        .update(deliveryTasks)
        .set({ updatedAt: new Date() })
        .where(eq(deliveryTasks.id, input.deliveryTaskId));

    return row;
}
