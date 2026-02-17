import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
/**
 * Connect to the database
 */
export declare function connectDatabase(): Promise<void>;
/**
 * Disconnect from the database
 */
export declare function disconnectDatabase(): Promise<void>;
export default prisma;
//# sourceMappingURL=database.d.ts.map