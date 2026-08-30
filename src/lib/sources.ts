import { prisma } from "@/lib/prisma";

export async function listActiveSources() {
  return prisma.intakeSource.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, label: true, isReferral: true },
  });
}
