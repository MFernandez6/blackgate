import { NextResponse } from "next/server";
import { bearerOrHeader, ingestWebhook } from "@/lib/webhooks";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = await ingestWebhook({
    channel: "partner",
    sourceSlug: "referral_attorney",
    secret: process.env.PARTNER_WEBHOOK_SECRET,
    providedSecret: bearerOrHeader(req, "x-webhook-secret"),
    body: body ?? {},
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json(
    { ok: true, id: result.id, intakeNumber: result.intakeNumber },
    { status: result.status }
  );
}
