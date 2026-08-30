import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Allocate BG-YY-#### inside the same transaction that creates the Intake.
 */
export async function allocateIntakeNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const yy = String(year).slice(-2);
  const row = await tx.intakeNumberSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return `BG-${yy}-${String(row.lastValue).padStart(4, "0")}`;
}
