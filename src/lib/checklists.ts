import type { Prisma } from "@prisma/client";
import type { ChecklistItemStatus, Occupancy } from "@/lib/types";
import { prisma } from "@/lib/prisma";

const SATISFIED: ChecklistItemStatus[] = [
  "COLLECTED",
  "TO_BE_GENERATED",
  "WAIVED",
  "NOT_APPLICABLE",
];

export function itemApplies(
  appliesWhen: string,
  occupancy: Occupancy | string | null | undefined,
  isReferral: boolean
): boolean {
  if (appliesWhen === "ALL") return true;
  if (appliesWhen === "REFERRAL") return isReferral;
  if (appliesWhen === "OWNER") return occupancy === "OWNER";
  if (appliesWhen === "RENTER") return occupancy === "RENTER";
  return true;
}

export function checklistProgress(
  items: Array<{ status: ChecklistItemStatus | string; itemDef: { required: boolean } }>
) {
  const required = items.filter((i) => i.itemDef.required);
  const collected = required.filter((i) =>
    SATISFIED.includes(i.status as ChecklistItemStatus)
  );
  const total = required.length;
  return {
    collected: collected.length,
    total,
    complete: total > 0 && collected.length === total,
    percent: total === 0 ? 100 : Math.round((collected.length / total) * 100),
  };
}

export async function instantiateChecklist(
  tx: Prisma.TransactionClient | typeof prisma,
  intakeId: string,
  claimType: "PROPERTY" | "PIP" | "DENIED_CLAIM",
  occupancy: Occupancy | string | null | undefined,
  isReferral: boolean
) {
  const template = await tx.checklistTemplate.findFirst({
    where: { claimType, isDefault: true },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) return [];

  const applicable = template.items.filter((def) =>
    itemApplies(def.appliesWhen, occupancy, isReferral)
  );

  if (applicable.length === 0) return [];

  await tx.intakeChecklistItem.createMany({
    data: applicable.map((def) => ({
      intakeId,
      itemDefId: def.id,
      status: def.canDeferToBlackletter ? "TO_BE_GENERATED" : "MISSING",
    })),
  });

  return tx.intakeChecklistItem.findMany({
    where: { intakeId },
    include: { itemDef: true },
  });
}
