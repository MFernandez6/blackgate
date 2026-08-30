import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Read-only partner list for BLACKLEDGER split calculations.
 */

function authorized(req: NextRequest): boolean {
  const key = process.env.BLACKLEDGER_API_KEY;
  if (!key) return false;
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : header;
  return token === key;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partners = await prisma.partner.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    partners: partners.map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      sourceSlug: p.slug.startsWith("referral") ? p.slug : null,
      defaultSplitPercent: 0,
    })),
  });
}

function reject() {
  return NextResponse.json(
    { error: "Partner export is read-only." },
    { status: 405 }
  );
}

export function POST() {
  return reject();
}
export function PUT() {
  return reject();
}
export function PATCH() {
  return reject();
}
export function DELETE() {
  return reject();
}
