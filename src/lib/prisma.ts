import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const globalPrisma = global as unknown as { prisma: PrismaClient };

if (process.env.NODE_ENV !== "production") globalPrisma.prisma = prisma;

export default prisma;
