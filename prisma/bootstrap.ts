/**
 * Non-destructive BLACKGATE lookup bootstrap for the shared BLACKBOX database.
 * Creates sources, partners, forms, and checklists only when missing.
 *
 *   npx tsx prisma/bootstrap.ts
 */

import { PrismaClient } from "@prisma/client";
import { formJsonFor, uplNoticeFor } from "../src/lib/forms/schemas";
import { UPL_NOTICE } from "../src/lib/constants";
import type { ClaimType } from "../src/lib/types";

const prisma = new PrismaClient();

const SOURCES = [
  { slug: "referral_claimsaver", label: "Referral — ClaimSaver+", isReferral: true, feeBearing: false, sortOrder: 10 },
  { slug: "referral_policyline", label: "Referral — thePolicyLine", isReferral: true, feeBearing: false, sortOrder: 20 },
  { slug: "referral_attorney", label: "Referral — attorney partner", isReferral: true, feeBearing: true, sortOrder: 30 },
  { slug: "direct_web", label: "Direct — website", isReferral: false, feeBearing: false, sortOrder: 40 },
  { slug: "direct_phone", label: "Direct — phone", isReferral: false, feeBearing: false, sortOrder: 50 },
  { slug: "direct_walk_in", label: "Direct — walk-in", isReferral: false, feeBearing: false, sortOrder: 60 },
  { slug: "marketing_campaign", label: "Marketing campaign", isReferral: false, feeBearing: false, sortOrder: 70 },
  { slug: "word_of_mouth", label: "Word of mouth", isReferral: false, feeBearing: false, sortOrder: 80 },
  { slug: "other", label: "Other", isReferral: false, feeBearing: false, sortOrder: 90 },
];

const PARTNERS = [
  { slug: "claimsaver", name: "ClaimSaver+", brand: "ClaimSaver+", referralCode: "claimsaver" },
  { slug: "policyline", name: "thePolicyLine", brand: "thePolicyLine", referralCode: "policyline" },
];

type ItemSeed = {
  slug: string;
  label: string;
  helpText: string;
  required?: boolean;
  appliesWhen?: string;
  canDeferToBlackletter?: boolean;
  canDeferToBlackmirror?: boolean;
  fieldTaskTitle?: string;
};

const SHARED_ITEMS: ItemSeed[] = [
  { slug: "signed_lor", label: "Signed Letter of Representation", helpText: "Flag as “to be generated” if BLACKLETTER will produce the LOR after triage.", canDeferToBlackletter: true },
  { slug: "photo_id", label: "Photo ID of claimant / policyholder", helpText: "Government-issued identification." },
  { slug: "declarations_page", label: "Declarations page / proof of coverage", helpText: "Dec page, binder, or other proof the policy exists." },
  { slug: "policy_carrier", label: "Policy number and carrier info", helpText: "Satisfied when captured on the intake form." },
  { slug: "prior_claim_history", label: "Prior claim history", helpText: "Carrier claim number and adjuster contact if known.", required: false },
  { slug: "notice_of_loss", label: "Notice of Loss / date of loss details", helpText: "Satisfied when date and narrative are on the form." },
  { slug: "damage_photos", label: "Photos or video of damage", helpText: "If the claimant cannot provide them, flag a BLACKMIRROR field visit.", required: false, canDeferToBlackmirror: true, fieldTaskTitle: "Capture damage photos" },
  { slug: "carrier_correspondence", label: "Prior correspondence from the carrier", helpText: "Denial letters, ROR letters, payment records.", required: false },
  { slug: "intake_disclosure", label: "Signed intake / UPL-compliant engagement disclosure", helpText: "Collected on every public and staff intake path." },
  { slug: "referral_agreement", label: "Referral or attorney co-counsel agreement", helpText: "Required only when the source is a referral type.", appliesWhen: "REFERRAL", required: false },
];

const PROPERTY_EXTRA: ItemSeed[] = [
  { slug: "mortgage_lienholder", label: "Mortgage / lienholder information", helpText: "Name of mortgagee or other lienholder on a property claim.", appliesWhen: "OWNER", required: false },
  { slug: "proof_of_ownership", label: "Proof of ownership or lease", helpText: "Deed/title for owners; lease for renters and tenants.", canDeferToBlackmirror: true, fieldTaskTitle: "Collect ownership or lease proof on site" },
];

async function ensureChecklist(claimType: ClaimType, extra: ItemSeed[]) {
  const existing = await prisma.checklistTemplate.findFirst({
    where: { claimType, isDefault: true },
  });
  if (existing) return;

  const form = await prisma.intakeForm.upsert({
    where: { claimType },
    create: {
      claimType,
      title:
        claimType === "PROPERTY"
          ? "Property intake"
          : claimType === "PIP"
            ? "PIP intake"
            : "Denied-claim intake",
      description: "Dynamic schema — UPL-safe language throughout.",
      schemaJson: formJsonFor(claimType),
      uplNotice: uplNoticeFor() || UPL_NOTICE,
    },
    update: {},
  });

  const template = await prisma.checklistTemplate.create({
    data: {
      claimType,
      formId: form.id,
      name: `${claimType} default checklist`,
      isDefault: true,
    },
  });

  await prisma.checklistItemDef.createMany({
    data: [...SHARED_ITEMS, ...extra].map((item, index) => ({
      templateId: template.id,
      slug: item.slug,
      label: item.label,
      helpText: item.helpText,
      required: item.required ?? true,
      sortOrder: (index + 1) * 10,
      appliesWhen: item.appliesWhen ?? "ALL",
      canDeferToBlackletter: item.canDeferToBlackletter ?? false,
      canDeferToBlackmirror: item.canDeferToBlackmirror ?? false,
      fieldTaskTitle: item.fieldTaskTitle,
    })),
  });
}

async function main() {
  for (const source of SOURCES) {
    await prisma.intakeSource.upsert({
      where: { slug: source.slug },
      create: source,
      update: { label: source.label, isReferral: source.isReferral, feeBearing: source.feeBearing, sortOrder: source.sortOrder },
    });
  }
  for (const partner of PARTNERS) {
    await prisma.partner.upsert({
      where: { slug: partner.slug },
      create: partner,
      update: { name: partner.name, brand: partner.brand },
    });
  }
  await ensureChecklist("PROPERTY", PROPERTY_EXTRA);
  await ensureChecklist("PIP", []);
  await ensureChecklist("DENIED_CLAIM", [
    { slug: "denial_letter", label: "Denial / ROR letter", helpText: "Required on denied-claim intakes when the claimant has it." },
    ...PROPERTY_EXTRA,
  ]);
  console.log("BLACKGATE bootstrap complete (sources, partners, checklists).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
