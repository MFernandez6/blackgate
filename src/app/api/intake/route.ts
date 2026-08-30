import { NextResponse } from "next/server";
import { publicIntakeSchema } from "@/lib/schemas/intake";
import { createIntakeRecord, answersFromInput } from "@/lib/intake-create";
import { prisma } from "@/lib/prisma";
import { storeIntakeDocument } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const raw = Object.fromEntries(
      Array.from(form.entries()).filter(([key]) => !key.startsWith("file_"))
    );
    const parsed = publicIntakeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 422 }
      );
    }

    const partnerCode = String(form.get("partnerCode") ?? "");
    const partner = partnerCode
      ? await prisma.partner.findUnique({ where: { referralCode: partnerCode } })
      : null;

    const intake = await createIntakeRecord({
      ...parsed.data,
      partnerId: partner?.id ?? null,
      formAnswers: answersFromInput({
        ...parsed.data,
        disclosureAccepted: parsed.data.disclosureAccepted,
        disclosureName: parsed.data.disclosureName,
      }),
    });

    for (const [key, value] of Array.from(form.entries())) {
      if (!key.startsWith("file_") || !(value instanceof File) || value.size === 0) {
        continue;
      }
      const slug = key.slice(5);
      const stored = await storeIntakeDocument(intake.id, value);
      const checklistItem = intake.checklistItems.find((i) => i.itemDef.slug === slug);
      const doc = await prisma.intakeDocument.create({
        data: {
          intakeId: intake.id,
          checklistItemId: checklistItem?.id,
          fileName: stored.fileName,
          fileUrl: stored.fileUrl,
          fileSizeBytes: stored.fileSizeBytes,
          mimeType: stored.mimeType,
        },
      });
      if (checklistItem) {
        await prisma.intakeChecklistItem.update({
          where: { id: checklistItem.id },
          data: { status: "COLLECTED", note: doc.fileName },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      id: intake.id,
      intakeNumber: intake.intakeNumber,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Could not submit intake.",
      },
      { status: 400 }
    );
  }
}
