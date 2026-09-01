"use server";

import { revalidatePath } from "next/cache";
import { canPromote, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checklistProgress } from "@/lib/checklists";
import {
  attachDocumentToBlackboxClaim,
  createBlackboxClaim,
  mapLossTypeForBlackbox,
} from "@/lib/integrations/blackbox";
import { createFieldTask } from "@/lib/integrations/blackmirror";
import { tagReferralForLedger } from "@/lib/integrations/blackledger";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function promoteIntakeAction(
  intakeId: string
): Promise<ActionResult<{ claimNumber: string; dryRun: boolean }>> {
  try {
    const session = await requireSession();
    if (!canPromote(session.user.role)) {
      return { ok: false, error: "Only a gatekeeper can promote an intake." };
    }

    const intake = await prisma.intake.findUnique({
      where: { id: intakeId },
      include: {
        source: true,
        referral: { include: { partner: true } },
        documents: true,
        checklistItems: { include: { itemDef: true } },
      },
    });
    if (!intake) return { ok: false, error: "Intake not found." };
    if (intake.status !== "ACCEPTED") {
      return { ok: false, error: "Accept the intake at triage before promoting." };
    }

    const progress = checklistProgress(intake.checklistItems);
    if (!progress.complete) {
      return {
        ok: false,
        error: `Checklist is ${progress.collected}/${progress.total}. Collect, generate, waive, mark N/A, or flag a field task on remaining required items.`,
      };
    }

    const payload = {
      claimants: [
        {
          firstName: intake.firstName,
          lastName: intake.lastName,
          email: intake.email,
          phone: intake.phone,
          mailingAddress: intake.mailingAddress || intake.propertyAddress || "On file",
          preferredContactMethod: intake.preferredContactMethod as
            | "EMAIL"
            | "PHONE"
            | "TEXT",
          isPrimaryContact: true,
        },
      ],
      property: {
        propertyAddress: intake.propertyAddress || intake.accidentLocation || "See intake",
        zipCode: intake.zipCode || "00000",
        county: intake.county || "Unknown",
        lossType: mapLossTypeForBlackbox(intake.lossType),
        dateOfLoss: (intake.dateOfLoss ?? intake.submittedAt).toISOString().slice(0, 10),
        lossDescription: intake.lossDescription || "See BLACKGATE intake file.",
        isCatClaim: intake.lossType === "WIND",
      },
      policy: {
        policyNumber: intake.policyNumber,
        carrierName: intake.carrierName,
        insurerClaimNumber: intake.insurerClaimNumber,
      },
      source: {
        product: "BLACKGATE" as const,
        intakeNumber: intake.intakeNumber,
        intakeId: intake.id,
      },
    };

    const created = await createBlackboxClaim(payload);
    if (!created.ok) {
      await prisma.handoffLog.create({
        data: {
          intakeId: intake.id,
          status: "FAILED",
          payloadJson: JSON.stringify(payload),
          errorMessage: created.error,
          performedById: session.user.id,
        },
      });
      return { ok: false, error: created.error };
    }

    let carried = 0;
    for (const doc of intake.documents) {
      const attached = await attachDocumentToBlackboxClaim({
        claimId: created.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
      });
      if (attached.ok) {
        await prisma.intakeDocument.update({
          where: { id: doc.id },
          data: { carriedToClaim: true },
        });
        carried += 1;
      }
    }

    let fieldTasks = 0;
    const fieldItems = intake.checklistItems.filter(
      (item) =>
        item.status === "FLAGGED_FIELD" ||
        (item.status === "MISSING" && item.itemDef.canDeferToBlackmirror)
    );
    for (const item of fieldItems) {
      const task = await createFieldTask({
        title: item.itemDef.fieldTaskTitle || `Collect: ${item.itemDef.label}`,
        description: `Outstanding intake item ${item.itemDef.slug} on ${intake.intakeNumber}. ${item.itemDef.helpText ?? ""}`.trim(),
        claimId: created.id,
        claimNumber: created.claimNumber,
        intakeNumber: intake.intakeNumber,
      });
      if (task.ok) {
        fieldTasks += 1;
        if (item.status === "MISSING") {
          await prisma.intakeChecklistItem.update({
            where: { id: item.id },
            data: { status: "FLAGGED_FIELD", note: "Field task opened in BLACKMIRROR" },
          });
        }
      }
    }

    let ledgerTagged = false;
    if (intake.source.feeBearing || intake.referral?.taggedForLedger) {
      const tag = await tagReferralForLedger({
        intakeNumber: intake.intakeNumber,
        claimNumber: created.claimNumber,
        partnerName: intake.referral?.partner?.name ?? intake.source.label,
        referringContact: intake.referral?.referringContact,
        feeTerms: intake.referral?.feeTerms,
        feePercent: intake.referral?.feePercent,
      });
      ledgerTagged = tag.ok;
      if (intake.referral && tag.ok) {
        await prisma.referral.update({
          where: { id: intake.referral.id },
          data: { taggedForLedger: true },
        });
      }
    }

    await prisma.$transaction([
      prisma.handoffLog.create({
        data: {
          intakeId: intake.id,
          status: "SUCCEEDED",
          blackboxClaimId: created.id,
          blackboxClaimNumber: created.claimNumber,
          fieldTasksCreated: fieldTasks,
          ledgerTagged,
          payloadJson: JSON.stringify({
            ...payload,
            documentsCarried: carried,
            dryRun: created.dryRun,
          }),
          performedById: session.user.id,
        },
      }),
      prisma.intake.update({
        where: { id: intake.id },
        data: { status: "PROMOTED" },
      }),
    ]);

    revalidatePath("/queue");
    revalidatePath(`/intakes/${intake.id}`);
    revalidatePath("/sources");
    return {
      ok: true,
      data: { claimNumber: created.claimNumber, dryRun: created.dryRun },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Promote failed.",
    };
  }
}
