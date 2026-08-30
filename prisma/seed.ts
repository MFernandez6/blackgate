/**
 * BLACKGATE seed — sources, forms, checklists, staff, partners, sample intakes.
 *
 *   ALLOW_DESTRUCTIVE_SEED=1 npx prisma db seed
 *
 * Default password for all seeded staff: Password123!
 * NEVER run against production.
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { formJsonFor, uplNoticeFor } from "../src/lib/forms/schemas";
import { UPL_NOTICE } from "../src/lib/constants";
import type {
  ClaimType,
  IntakeStatus,
  LossType,
  Occupancy,
} from "../src/lib/types";

const prisma = new PrismaClient();

if (process.env.ALLOW_DESTRUCTIVE_SEED !== "1") {
  console.error(
    "Refusing to seed: set ALLOW_DESTRUCTIVE_SEED=1. Never use on production."
  );
  process.exit(1);
}

const SEED_PASSWORD = "Password123!";

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
  {
    slug: "signed_lor",
    label: "Signed Letter of Representation",
    helpText: "Flag as “to be generated” if BLACKLETTER will produce the LOR after triage.",
    canDeferToBlackletter: true,
  },
  {
    slug: "photo_id",
    label: "Photo ID of claimant / policyholder",
    helpText: "Government-issued identification.",
  },
  {
    slug: "declarations_page",
    label: "Declarations page / proof of coverage",
    helpText: "Dec page, binder, or other proof the policy exists.",
  },
  {
    slug: "policy_carrier",
    label: "Policy number and carrier info",
    helpText: "Satisfied when captured on the intake form.",
  },
  {
    slug: "prior_claim_history",
    label: "Prior claim history",
    helpText: "Carrier claim number and adjuster contact if known.",
    required: false,
  },
  {
    slug: "notice_of_loss",
    label: "Notice of Loss / date of loss details",
    helpText: "Satisfied when date and narrative are on the form.",
  },
  {
    slug: "damage_photos",
    label: "Photos or video of damage",
    helpText: "If the claimant cannot provide them, flag a BLACKMIRROR field visit.",
    required: false,
    canDeferToBlackmirror: true,
    fieldTaskTitle: "Capture damage photos",
  },
  {
    slug: "carrier_correspondence",
    label: "Prior correspondence from the carrier",
    helpText: "Denial letters, ROR letters, payment records.",
    required: false,
  },
  {
    slug: "intake_disclosure",
    label: "Signed intake / UPL-compliant engagement disclosure",
    helpText: "Collected on every public and staff intake path.",
  },
  {
    slug: "referral_agreement",
    label: "Referral or attorney co-counsel agreement",
    helpText: "Required only when the source is a referral type.",
    appliesWhen: "REFERRAL",
    required: false,
  },
];

const PROPERTY_EXTRA: ItemSeed[] = [
  {
    slug: "mortgage_lienholder",
    label: "Mortgage / lienholder information",
    helpText: "Name of mortgagee or other lienholder on a property claim.",
    appliesWhen: "OWNER",
    required: false,
  },
  {
    slug: "proof_of_ownership",
    label: "Proof of ownership or lease",
    helpText: "Deed/title for owners; lease for renters and tenants.",
    canDeferToBlackmirror: true,
    fieldTaskTitle: "Collect ownership or lease proof on site",
  },
];

async function seedChecklist(claimType: ClaimType, extra: ItemSeed[]) {
  const form = await prisma.intakeForm.create({
    data: {
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
  });

  const template = await prisma.checklistTemplate.create({
    data: {
      claimType,
      formId: form.id,
      name: `${claimType} default checklist`,
      isDefault: true,
    },
  });

  const items = [...SHARED_ITEMS, ...extra];
  await prisma.checklistItemDef.createMany({
    data: items.map((item, index) => ({
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
  await prisma.handoffLog.deleteMany();
  await prisma.intakeDocument.deleteMany();
  await prisma.intakeChecklistItem.deleteMany();
  await prisma.triageDecision.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.intake.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.checklistItemDef.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.intakeForm.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.intakeSource.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.intakeNumberSequence.deleteMany();

  const passwordHash = await hash(SEED_PASSWORD, 10);

  const [miguel, gate, staff] = await Promise.all([
    prisma.staff.create({
      data: {
        name: "Miguel Fernandez",
        email: "miguel@blacklinepa.com",
        passwordHash,
        role: "ADMIN",
      },
    }),
    prisma.staff.create({
      data: {
        name: "Elena Voss",
        email: "gate@blacklinepa.com",
        passwordHash,
        role: "GATEKEEPER",
      },
    }),
    prisma.staff.create({
      data: {
        name: "Andre Cole",
        email: "intake@blacklinepa.com",
        passwordHash,
        role: "INTAKE_STAFF",
      },
    }),
  ]);

  for (const source of SOURCES) {
    await prisma.intakeSource.create({ data: source });
  }

  const claimsaver = await prisma.partner.create({
    data: {
      slug: "claimsaver",
      name: "ClaimSaver+",
      brand: "ClaimSaver+",
      referralCode: "claimsaver",
      contactEmail: "referrals@claimsaver.app",
    },
  });
  const policyline = await prisma.partner.create({
    data: {
      slug: "policyline",
      name: "thePolicyLine",
      brand: "thePolicyLine",
      referralCode: "policyline",
      contactEmail: "hello@thepolicyline.com",
    },
  });
  const attorney = await prisma.partner.create({
    data: {
      slug: "rivera-law",
      name: "Rivera & Associates",
      brand: "Attorney partner",
      referralCode: "rivera",
      contactName: "Ana Rivera, Esq.",
      contactEmail: "ana@riveralaw.example",
    },
  });

  await seedChecklist("PROPERTY", PROPERTY_EXTRA);
  await seedChecklist("PIP", []);
  await seedChecklist("DENIED_CLAIM", [
    {
      slug: "denial_letter",
      label: "Denial / ROR letter",
      helpText: "Required on denied-claim intakes when the claimant has it.",
    },
    ...PROPERTY_EXTRA,
  ]);

  const sourceBySlug = Object.fromEntries(
    (await prisma.intakeSource.findMany()).map((s) => [s.slug, s])
  );

  const { createIntakeRecord } = await import("../src/lib/intake-create");

  const samples: Array<{
    status: IntakeStatus;
    sourceSlug: string;
    claimType: ClaimType;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    propertyAddress?: string;
    city?: string;
    zipCode?: string;
    county?: string;
    occupancy?: Occupancy;
    dateOfLoss?: string;
    lossType?: LossType;
    lossDescription?: string;
    carrierName?: string;
    policyNumber?: string;
    insurerClaimNumber?: string;
    partnerId?: string;
    referringContact?: string;
    feeTerms?: string;
    campaignName?: string;
    createdById?: string;
    decide?: { outcome: "ACCEPTED" | "DECLINED" | "NEEDS_INFO"; code: string };
    extraCollected?: string[];
    extraField?: string[];
  }> = [
    {
      status: "IN_REVIEW",
      sourceSlug: "referral_claimsaver",
      claimType: "PIP",
      firstName: "Marisol",
      lastName: "Hendricks",
      email: "marisol.h@example.com",
      phone: "3055550101",
      dateOfLoss: "2026-07-12",
      lossType: "AUTO",
      lossDescription: "Rear-ended on I-95. Treating with clinic; carrier file opened.",
      carrierName: "GEICO",
      policyNumber: "FL-PIP-44102",
      partnerId: claimsaver.id,
      referringContact: "ClaimSaver+ worksheet CS202607-1188",
    },
    {
      status: "SUBMITTED",
      sourceSlug: "referral_policyline",
      claimType: "PROPERTY",
      firstName: "James",
      lastName: "Ortiz",
      email: "j.ortiz@example.com",
      phone: "7865550144",
      propertyAddress: "1880 Coral Way",
      city: "Miami",
      zipCode: "33145",
      county: "Miami-Dade",
      occupancy: "OWNER",
      dateOfLoss: "2026-08-02",
      lossType: "WIND",
      lossDescription: "Hurricane damage to roof and soffit. Dec page uploaded.",
      carrierName: "Citizens",
      policyNumber: "CIT-992188",
      partnerId: policyline.id,
      extraCollected: ["declarations_page", "photo_id"],
    },
    {
      status: "NEEDS_INFO",
      sourceSlug: "direct_walk_in",
      claimType: "DENIED_CLAIM",
      firstName: "Priya",
      lastName: "Shah",
      email: "priya.shah@example.com",
      phone: "9545550190",
      propertyAddress: "42 Oak Run",
      city: "Fort Lauderdale",
      zipCode: "33301",
      county: "Broward",
      occupancy: "OWNER",
      dateOfLoss: "2026-03-18",
      lossType: "WATER",
      lossDescription: "Supply-line rupture. Carrier denied as wear and tear.",
      carrierName: "State Farm",
      createdById: staff.id,
      decide: { outcome: "NEEDS_INFO", code: "INSUFFICIENT_DOCS" },
    },
    {
      status: "SUBMITTED",
      sourceSlug: "marketing_campaign",
      claimType: "PROPERTY",
      firstName: "Leo",
      lastName: "Grant",
      email: "leo.grant@example.com",
      phone: "4075550166",
      propertyAddress: "900 Pinecrest Dr",
      city: "Orlando",
      zipCode: "32801",
      county: "Orange",
      occupancy: "RENTER",
      dateOfLoss: "2026-08-20",
      lossType: "WATER",
      lossDescription: "Upstairs leak into unit. Saw Instagram ad.",
      campaignName: "Storm season 2026 — Instagram",
    },
    {
      status: "ACCEPTED",
      sourceSlug: "referral_attorney",
      claimType: "PROPERTY",
      firstName: "Helena",
      lastName: "Brooks",
      email: "helena.brooks@example.com",
      phone: "5615550177",
      propertyAddress: "12 Seagrape Lane",
      city: "Delray Beach",
      zipCode: "33483",
      county: "Palm Beach",
      occupancy: "OWNER",
      dateOfLoss: "2026-06-01",
      lossType: "HAIL",
      lossDescription: "Hail event. Counsel asked Blackline to handle the PA file.",
      carrierName: "Universal",
      policyNumber: "UNI-55019",
      partnerId: attorney.id,
      referringContact: "Ana Rivera, Esq.",
      feeTerms: "10% of public-adjuster fee — BLACKLEDGER",
      decide: { outcome: "ACCEPTED", code: "COVERAGE_FIT" },
      extraCollected: [
        "photo_id",
        "declarations_page",
        "policy_carrier",
        "notice_of_loss",
        "intake_disclosure",
        "proof_of_ownership",
        "signed_lor",
      ],
    },
    {
      status: "IN_REVIEW",
      sourceSlug: "direct_phone",
      claimType: "PROPERTY",
      firstName: "Calvin",
      lastName: "Nguyen",
      email: "calvin.n@example.com",
      phone: "8135550122",
      propertyAddress: "771 Bayshore",
      city: "Tampa",
      zipCode: "33602",
      county: "Hillsborough",
      occupancy: "OWNER",
      dateOfLoss: "2026-08-11",
      lossType: "FIRE",
      lossDescription: "Kitchen fire. Called the office. Photos not yet taken.",
      createdById: staff.id,
      extraField: ["damage_photos"],
    },
    {
      status: "DECLINED",
      sourceSlug: "word_of_mouth",
      claimType: "PIP",
      firstName: "Nora",
      lastName: "Perez",
      email: "nora.perez@example.com",
      phone: "2395550188",
      dateOfLoss: "2024-01-04",
      lossType: "AUTO",
      lossDescription: "Old accident; looking for a late PIP filing.",
      decide: { outcome: "DECLINED", code: "STATUTE_CONCERN" },
    },
    {
      status: "PROMOTED",
      sourceSlug: "direct_web",
      claimType: "PROPERTY",
      firstName: "Owen",
      lastName: "Clarke",
      email: "owen.clarke@example.com",
      phone: "9045550133",
      propertyAddress: "5 Riverside Ct",
      city: "Jacksonville",
      zipCode: "32202",
      county: "Duval",
      occupancy: "OWNER",
      dateOfLoss: "2026-05-09",
      lossType: "WIND",
      lossDescription: "Wind-driven rain. Promoted to BLACKBOX in dry-run.",
      carrierName: "Heritage",
      policyNumber: "HER-22011",
      extraCollected: [
        "photo_id",
        "declarations_page",
        "policy_carrier",
        "notice_of_loss",
        "intake_disclosure",
        "proof_of_ownership",
        "signed_lor",
        "damage_photos",
      ],
      decide: { outcome: "ACCEPTED", code: "COVERAGE_FIT" },
    },
  ];

  let seq = 0;
  for (const sample of samples) {
    seq += 1;
    const created = await createIntakeRecord({
      sourceSlug: sample.sourceSlug,
      claimType: sample.claimType,
      firstName: sample.firstName,
      lastName: sample.lastName,
      email: sample.email,
      phone: sample.phone,
      preferredContactMethod: "PHONE",
      propertyAddress: sample.propertyAddress,
      city: sample.city,
      zipCode: sample.zipCode,
      county: sample.county,
      occupancy: sample.occupancy,
      dateOfLoss: sample.dateOfLoss,
      lossType: sample.lossType,
      lossDescription: sample.lossDescription,
      carrierName: sample.carrierName,
      policyNumber: sample.policyNumber,
      insurerClaimNumber: sample.insurerClaimNumber,
      partnerId: sample.partnerId,
      referringContact: sample.referringContact,
      feeTerms: sample.feeTerms,
      campaignName: sample.campaignName,
      disclosureAccepted: true,
      disclosureName: `${sample.firstName} ${sample.lastName}`,
      createdById: sample.createdById,
      sourceDetail: sample.campaignName ?? sample.referringContact,
    });

    if (sample.extraCollected?.length) {
      await prisma.intakeChecklistItem.updateMany({
        where: {
          intakeId: created.id,
          itemDef: { slug: { in: sample.extraCollected } },
        },
        data: { status: "COLLECTED" },
      });
    }
    if (sample.extraField?.length) {
      await prisma.intakeChecklistItem.updateMany({
        where: {
          intakeId: created.id,
          itemDef: { slug: { in: sample.extraField } },
        },
        data: { status: "FLAGGED_FIELD", note: "Queued for BLACKMIRROR" },
      });
    }

    if (sample.decide) {
      await prisma.triageDecision.create({
        data: {
          intakeId: created.id,
          outcome: sample.decide.outcome,
          reasonCode: sample.decide.code,
          decidedById: gate.id,
        },
      });
    }

    if (sample.status === "PROMOTED") {
      await prisma.handoffLog.create({
        data: {
          intakeId: created.id,
          status: "SUCCEEDED",
          blackboxClaimId: `dry-seed-${created.id}`,
          blackboxClaimNumber: `BL-26-9${String(seq).padStart(3, "0")}`,
          fieldTasksCreated: 0,
          ledgerTagged: false,
          payloadJson: JSON.stringify({ dryRun: true }),
          performedById: miguel.id,
        },
      });
    }

    await prisma.intake.update({
      where: { id: created.id },
      data: { status: sample.status },
    });
  }

  // Keep sequence aligned with created intakes
  await prisma.intakeNumberSequence.upsert({
    where: { year: new Date().getFullYear() },
    create: { year: new Date().getFullYear(), lastValue: samples.length },
    update: { lastValue: samples.length },
  });

  console.log("BLACKGATE seed complete.");
  console.log("  Admin        miguel@blacklinepa.com / Password123!");
  console.log("  Gatekeeper   gate@blacklinepa.com / Password123!");
  console.log("  Intake staff intake@blacklinepa.com / Password123!");
  console.log(`  Sources: ${Object.keys(sourceBySlug).length}  Intakes: ${samples.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
