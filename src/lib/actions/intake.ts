"use server";

import { revalidatePath } from "next/cache";
import { canEditIntake, requireSession } from "@/lib/auth";
import { staffIntakeSchema } from "@/lib/schemas/intake";
import { createIntakeRecord, answersFromInput } from "@/lib/intake-create";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createStaffIntakeAction(
  raw: unknown
): Promise<ActionResult<{ id: string; intakeNumber: string }>> {
  try {
    const session = await requireSession();
    if (!canEditIntake(session.user.role)) {
      return { ok: false, error: "Insufficient privileges to open an intake." };
    }
    const parsed = staffIntakeSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.errors[0]?.message ?? "Validation failed.",
      };
    }
    const input = {
      ...parsed.data,
      createdById: session.user.id,
      formAnswers: answersFromInput({
        ...parsed.data,
        disclosureAccepted: parsed.data.disclosureAccepted,
        disclosureName: parsed.data.disclosureName,
      }),
    };
    const intake = await createIntakeRecord(input);
    revalidatePath("/queue");
    revalidatePath("/sources");
    return {
      ok: true,
      data: { id: intake.id, intakeNumber: intake.intakeNumber },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not create intake.",
    };
  }
}
