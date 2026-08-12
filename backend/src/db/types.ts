import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

/**
 * Type for Drizzle ORM transaction client
 * Use this type for transaction callbacks to ensure proper typing
 * 
 * @example
 * await db.transaction(async (tx: DbTransaction) => {
 *   const [user] = await tx.select().from(users).where(eq(users.id, userId));
 *   // ... more operations
 * });
 */
export type DbTransaction = PostgresJsDatabase<typeof schema>;
