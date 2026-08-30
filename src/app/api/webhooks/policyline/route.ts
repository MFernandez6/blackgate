import { NextResponse } from "next/server";
import { bearerOrHeader, ingestWebhook } from "@/lib/webhooks";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = await ingestWebhook({
    channel: "policyline",
    sourceSlug: "referral_policyline",
    secret: process.env.POLICYLINE_WEBHOOK_SECRET,
    providedSecret: bearerOrHeader(req, "x-webhook-secret"),
    body: { ...(body ?? {}), claimType: body?.claimType ?? "PROPERTY" },
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json(
    { ok: true, id: result.id, intakeNumber: result.intakeNumber },
    { status: result.status }
  );
}
