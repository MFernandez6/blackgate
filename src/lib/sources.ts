import { prisma } from "@/lib/prisma";

export const FALLBACK_SOURCES = [
  { slug: "referral_claimsaver", label: "Referral — ClaimSaver+", isReferral: true },
  { slug: "referral_policyline", label: "Referral — thePolicyLine", isReferral: true },
  { slug: "referral_attorney", label: "Referral — attorney partner", isReferral: true },
  { slug: "direct_web", label: "Direct — website", isReferral: false },
  { slug: "direct_phone", label: "Direct — phone", isReferral: false },
  { slug: "direct_walk_in", label: "Direct — walk-in", isReferral: false },
  { slug: "marketing_campaign", label: "Marketing campaign", isReferral: false },
  { slug: "word_of_mouth", label: "Word of mouth", isReferral: false },
  { slug: "other", label: "Other", isReferral: false },
] as const;

export type SourceOption = {
  slug: string;
  label: string;
  isReferral: boolean;
};

export async function listActiveSources(): Promise<SourceOption[]> {
  try {
    const rows = await prisma.intakeSource.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, label: true, isReferral: true },
    });
    if (rows.length > 0) return rows;
  } catch (err) {
    console.error("[BLACKGATE] listActiveSources failed", err);
  }
  return FALLBACK_SOURCES.map((s) => ({ ...s }));
}
