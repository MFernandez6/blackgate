import { NextResponse } from "next/server";
import { getSession, canEditIntake } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeIntakeDocument } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!canEditIntake(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const intakeId = String(form.get("intakeId") ?? "");
  const checklistItemId = String(form.get("checklistItemId") ?? "") || null;
  const file = form.get("file");
  if (!intakeId || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Missing file or intake." }, { status: 422 });
  }

  const intake = await prisma.intake.findUnique({ where: { id: intakeId } });
  if (!intake) {
    return NextResponse.json({ ok: false, error: "Intake not found." }, { status: 404 });
  }

  const stored = await storeIntakeDocument(intakeId, file);
  const doc = await prisma.intakeDocument.create({
    data: {
      intakeId,
      checklistItemId,
      fileName: stored.fileName,
      fileUrl: stored.fileUrl,
      fileSizeBytes: stored.fileSizeBytes,
      mimeType: stored.mimeType,
      uploadedById: session.user.id,
    },
  });

  if (checklistItemId) {
    await prisma.intakeChecklistItem.update({
      where: { id: checklistItemId },
      data: { status: "COLLECTED", note: stored.fileName },
    });
    if (intake.status === "SUBMITTED") {
      await prisma.intake.update({
        where: { id: intakeId },
        data: { status: "IN_REVIEW" },
      });
    }
  }

  return NextResponse.json({ ok: true, id: doc.id, fileUrl: doc.fileUrl });
}
