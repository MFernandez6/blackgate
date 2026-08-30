"use server";

import { revalidatePath } from "next/cache";
import { canTriage, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triageSchema, checklistUpdateSchema } from "@/lib/schemas/intake";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function recordTriageAction(
  raw: unknown
): Promise<ActionResult<{ status: string }>> {
  try {
    const session = await requireSession();
    if (!canTriage(session.user.role)) {
      return { ok: false, error: "Only a gatekeeper can record a triage decision." };
    }
    const parsed = triageSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.errors[0]?.message ?? "Validation failed.",
      };
    }

    const intake = await prisma.intake.findUnique({
      where: { id: parsed.data.intakeId },
    });
    if (!intake) return { ok: false, error: "Intake not found." };
    if (intake.status === "PROMOTED") {
      return { ok: false, error: "This intake has already been promoted." };
    }

    const nextStatus =
      parsed.data.outcome === "ACCEPTED"
        ? "ACCEPTED"
        : parsed.data.outcome === "DECLINED"
          ? "DECLINED"
          : "NEEDS_INFO";

    await prisma.$transaction([
      prisma.triageDecision.create({
        data: {
          intakeId: intake.id,
          outcome: parsed.data.outcome,
          reasonCode: parsed.data.reasonCode,
          reasonNote: parsed.data.reasonNote,
          decidedById: session.user.id,
        },
      }),
      prisma.intake.update({
        where: { id: intake.id },
        data: { status: nextStatus },
      }),
    ]);

    revalidatePath("/queue");
    revalidatePath(`/intakes/${intake.id}`);
    revalidatePath("/sources");
    return { ok: true, data: { status: nextStatus } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Triage failed.",
    };
  }
}

export async function updateChecklistItemAction(
  raw: unknown
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (session.user.role === "VIEWER") {
      return { ok: false, error: "Viewers cannot update the checklist." };
    }
    const parsed = checklistUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.errors[0]?.message ?? "Validation failed.",
      };
    }

    const item = await prisma.intakeChecklistItem.update({
      where: { id: parsed.data.itemId },
      data: { status: parsed.data.status, note: parsed.data.note },
      include: { intake: true },
    });

    if (item.intake.status === "SUBMITTED") {
      await prisma.intake.update({
        where: { id: item.intakeId },
        data: { status: "IN_REVIEW" },
      });
    }

    revalidatePath(`/intakes/${item.intakeId}`);
    revalidatePath("/queue");
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Checklist update failed.",
    };
  }
}
