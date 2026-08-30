import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SLUG_TO_TYPE: Record<string, string> = {
  signed_lor: "LOR",
  intake_disclosure: "CLIENT_DISCLOSURE",
};

function authorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : header;
  const keys = [
    process.env.BLACKLETTER_API_KEY,
    process.env.BLACKGATE_API_KEY,
    process.env.BLACKLEDGER_API_KEY,
  ].filter(Boolean);
  return Boolean(token && keys.includes(token));
}

/**
 * Read-only: documents already collected at intake so BLACKLETTER
 * does not regenerate a signed LOR / disclosure.
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const intakeNumber = req.nextUrl.searchParams.get("intakeNumber");
  const claimNumber = req.nextUrl.searchParams.get("claimNumber");

  const intake = intakeNumber
    ? await prisma.intake.findUnique({
        where: { intakeNumber },
        include: {
          checklistItems: { include: { itemDef: true, documents: true } },
          documents: true,
          handoffs: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      })
    : claimNumber
      ? await prisma.intake.findFirst({
          where: {
            handoffs: { some: { blackboxClaimNumber: claimNumber } },
          },
          include: {
            checklistItems: { include: { itemDef: true, documents: true } },
            documents: true,
            handoffs: { orderBy: { createdAt: "desc" }, take: 3 },
          },
        })
      : null;

  if (!intake) {
    return NextResponse.json({ documents: [] });
  }

  const documents: Array<{
    documentType: string;
    status: string;
    fileUrl: string | null;
    source: string;
  }> = intake.checklistItems
    .filter((item) => SLUG_TO_TYPE[item.itemDef.slug])
    .filter((item) => item.status === "COLLECTED" || item.documents.length > 0)
    .map((item) => ({
      documentType: SLUG_TO_TYPE[item.itemDef.slug],
      status: "executed",
      fileUrl: item.documents[0]?.fileUrl ?? null,
      source: "BLACKGATE",
    }));

  if (intake.disclosureAccepted) {
    const hasDisclosure = documents.some((d) => d.documentType === "CLIENT_DISCLOSURE");
    if (!hasDisclosure) {
      documents.push({
        documentType: "CLIENT_DISCLOSURE",
        status: "executed",
        fileUrl: null,
        source: "BLACKGATE",
      });
    }
  }

  return NextResponse.json({
    intakeNumber: intake.intakeNumber,
    intakeId: intake.id,
    claimNumber:
      intake.handoffs.find((h) => h.blackboxClaimNumber)?.blackboxClaimNumber ??
      null,
    documents,
  });
}
