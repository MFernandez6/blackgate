import type { LossType } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { webhookIntakeSchema } from "@/lib/schemas/intake";
import { createIntakeRecord } from "@/lib/intake-create";

function mapDamageType(value?: string | null): LossType | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v.includes("wind") || v.includes("hurricane") || v.includes("storm")) return "WIND";
  if (v.includes("fire") || v.includes("smoke")) return "FIRE";
  if (v.includes("water") || v.includes("plumb")) return "WATER";
  if (v.includes("hail")) return "HAIL";
  if (v.includes("theft") || v.includes("vandal")) return "VANDALISM";
  if (v.includes("auto") || v.includes("accident")) return "AUTO";
  return "OTHER";
}

export async function ingestWebhook(opts: {
  channel: string;
  sourceSlug: string;
  secret: string | undefined;
  providedSecret: string | null;
  body: unknown;
}) {
  if (!opts.secret || opts.providedSecret !== opts.secret) {
    await prisma.webhookEvent.create({
      data: {
        channel: opts.channel,
        status: "REJECTED",
        payloadJson: JSON.stringify(opts.body ?? {}),
        errorMessage: "Invalid webhook secret",
      },
    });
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const parsed = webhookIntakeSchema.safeParse(opts.body);
  if (!parsed.success) {
    await prisma.webhookEvent.create({
      data: {
        channel: opts.channel,
        status: "REJECTED",
        payloadJson: JSON.stringify(opts.body ?? {}),
        errorMessage: parsed.error.errors[0]?.message ?? "Invalid payload",
      },
    });
    return {
      ok: false as const,
      status: 422,
      error: parsed.error.errors[0]?.message ?? "Invalid payload",
    };
  }

  const data = parsed.data;
  const worksheet = (data.worksheet ?? {}) as Record<string, unknown>;
  const firstName =
    data.firstName ||
    String(worksheet.claimantName ?? "").split(" ")[0] ||
    "Unknown";
  const lastName =
    data.lastName ||
    String(worksheet.claimantName ?? "").split(" ").slice(1).join(" ") ||
    "Claimant";

  const intake = await createIntakeRecord({
    sourceSlug: opts.sourceSlug,
    claimType: data.claimType,
    firstName,
    lastName,
    email: data.email || String(worksheet.claimantEmail ?? ""),
    phone: data.phone || String(worksheet.claimantPhone ?? "0000000"),
    preferredContactMethod: data.preferredContactMethod,
    propertyAddress: data.propertyAddress || String(worksheet.claimantAddress ?? ""),
    zipCode: data.zipCode || data.zip,
    city: data.city,
    county: data.county,
    dateOfLoss: data.dateOfLoss || data.dateOfAccident || String(worksheet.dateOfAccident ?? ""),
    lossType: data.lossType ?? mapDamageType(data.damageType),
    lossDescription: data.lossDescription || String(worksheet.accidentDescription ?? ""),
    policyNumber: data.policyNumber || String(worksheet.policyNumber ?? ""),
    carrierName: data.carrierName || data.insuranceCompany || String(worksheet.insuranceCompany ?? ""),
    insurerClaimNumber: data.insurerClaimNumber || data.fileNumber,
    occupancy: data.occupancy,
    referringContact: data.referringContact,
    referringEmail: data.referringEmail,
    campaignName: data.campaignName,
    sourceDetail: data.sourceDetail ?? data.source,
    disclosureAccepted: true,
    disclosureName: `${firstName} ${lastName}`.trim(),
    formAnswers: { webhook: opts.channel, ...data },
  });

  await prisma.webhookEvent.create({
    data: {
      channel: opts.channel,
      status: "PROCESSED",
      payloadJson: JSON.stringify(opts.body ?? {}),
      intakeId: intake.id,
    },
  });

  return {
    ok: true as const,
    status: 201,
    id: intake.id,
    intakeNumber: intake.intakeNumber,
  };
}

export function bearerOrHeader(req: Request, headerName: string): string | null {
  const named = req.headers.get(headerName);
  if (named) return named;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}
