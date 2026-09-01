import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url || url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL must be the shared BLACKBOX Postgres pooler URL."
    );
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url } },
  });
}

/**
 * Lazy client so `next build` does not instantiate Prisma at import time.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = (globalForPrisma.prisma ??= createPrismaClient());
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
