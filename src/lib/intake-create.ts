import type { Prisma } from "@prisma/client";
import type {
  ClaimType,
  LossType,
  Occupancy,
  PreferredContactMethod,
} from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { allocateIntakeNumber } from "@/lib/intake-number";
import { instantiateChecklist } from "@/lib/checklists";

export type IntakeCreateInput = {
  sourceSlug: string;
  sourceDetail?: string | null;
  campaignName?: string | null;
  claimType: ClaimType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContactMethod: PreferredContactMethod;
  mailingAddress?: string | null;
  dateOfLoss?: string | null;
  lossType?: LossType | null;
  lossDescription?: string | null;
  propertyAddress?: string | null;
  city?: string | null;
  zipCode?: string | null;
  county?: string | null;
  occupancy?: Occupancy | null;
  policyNumber?: string | null;
  carrierName?: string | null;
  insurerClaimNumber?: string | null;
  priorClaimNumber?: string | null;
  priorAdjusterName?: string | null;
  priorAdjusterPhone?: string | null;
  accidentLocation?: string | null;
  injuryDescription?: string | null;
  vehicleYear?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  denialDate?: string | null;
  denialReason?: string | null;
  mortgageeName?: string | null;
  ownershipProofNote?: string | null;
  referringContact?: string | null;
  referringEmail?: string | null;
  referringPhone?: string | null;
  feeTerms?: string | null;
  feePercent?: number | null;
  partnerId?: string | null;
  disclosureAccepted: boolean;
  disclosureName: string;
  createdById?: string | null;
  formAnswers?: Record<string, unknown> | null;
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createIntakeRecord(input: IntakeCreateInput) {
  const source = await prisma.intakeSource.findUnique({
    where: { slug: input.sourceSlug },
  });
  if (!source || !source.isActive) {
    throw new Error("Unknown or inactive intake source.");
  }
  if (!input.disclosureAccepted) {
    throw new Error("Intake disclosure must be acknowledged.");
  }

  return prisma.$transaction(async (tx) => {
    const intakeNumber = await allocateIntakeNumber(tx);
    const intake = await tx.intake.create({
      data: {
        intakeNumber,
        claimType: input.claimType,
        sourceId: source.id,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        preferredContactMethod: input.preferredContactMethod,
        mailingAddress: input.mailingAddress,
        dateOfLoss: parseDate(input.dateOfLoss),
        lossType: input.lossType ?? null,
        lossDescription: input.lossDescription,
        propertyAddress: input.propertyAddress,
        city: input.city,
        zipCode: input.zipCode,
        county: input.county,
        occupancy: input.occupancy ?? null,
        policyNumber: input.policyNumber,
        carrierName: input.carrierName,
        insurerClaimNumber: input.insurerClaimNumber,
        priorClaimNumber: input.priorClaimNumber,
        priorAdjusterName: input.priorAdjusterName,
        priorAdjusterPhone: input.priorAdjusterPhone,
        accidentLocation: input.accidentLocation,
        injuryDescription: input.injuryDescription,
        vehicleYear: input.vehicleYear,
        vehicleMake: input.vehicleMake,
        vehicleModel: input.vehicleModel,
        denialDate: parseDate(input.denialDate),
        denialReason: input.denialReason,
        mortgageeName: input.mortgageeName,
        ownershipProofNote: input.ownershipProofNote,
        formAnswers: input.formAnswers ? JSON.stringify(input.formAnswers) : null,
        sourceDetail: input.sourceDetail,
        campaignName: input.campaignName,
        disclosureAccepted: true,
        disclosureSignedAt: new Date(),
        disclosureName: input.disclosureName.trim(),
        createdById: input.createdById ?? null,
      },
    });

    if (source.isReferral) {
      await tx.referral.create({
        data: {
          intakeId: intake.id,
          partnerId: input.partnerId ?? null,
          referringContact: input.referringContact,
          referringEmail: input.referringEmail,
          referringPhone: input.referringPhone,
          feeTerms: input.feeTerms,
          feePercent: input.feePercent,
          taggedForLedger: source.feeBearing,
        },
      });
    }

    await instantiateChecklist(
      tx,
      intake.id,
      input.claimType,
      input.occupancy ?? null,
      source.isReferral
    );

    // Disclosure is collected on submit — mark that checklist item collected.
    const disclosureItem = await tx.intakeChecklistItem.findFirst({
      where: {
        intakeId: intake.id,
        itemDef: { slug: "intake_disclosure" },
      },
    });
    if (disclosureItem) {
      await tx.intakeChecklistItem.update({
        where: { id: disclosureItem.id },
        data: { status: "COLLECTED", note: `Signed by ${input.disclosureName}` },
      });
    }

    // Policy number / carrier from the form satisfies that checklist row.
    if (input.policyNumber || input.carrierName) {
      const policyItem = await tx.intakeChecklistItem.findFirst({
        where: {
          intakeId: intake.id,
          itemDef: { slug: "policy_carrier" },
        },
      });
      if (policyItem) {
        await tx.intakeChecklistItem.update({
          where: { id: policyItem.id },
          data: {
            status: "COLLECTED",
            note: [input.carrierName, input.policyNumber].filter(Boolean).join(" · "),
          },
        });
      }
    }

    if (input.dateOfLoss || input.lossDescription) {
      const nol = await tx.intakeChecklistItem.findFirst({
        where: { intakeId: intake.id, itemDef: { slug: "notice_of_loss" } },
      });
      if (nol) {
        await tx.intakeChecklistItem.update({
          where: { id: nol.id },
          data: { status: "COLLECTED", note: "Captured on intake form" },
        });
      }
    }

    return tx.intake.findUniqueOrThrow({
      where: { id: intake.id },
      include: {
        source: true,
        referral: { include: { partner: true } },
        checklistItems: { include: { itemDef: true } },
      },
    });
  });
}

export function answersFromInput(
  input: IntakeCreateInput
): Record<string, unknown> {
  const { formAnswers: _ignored, ...rest } = input;
  return rest;
}

export type CreatedIntake = Prisma.IntakeGetPayload<{
  include: {
    source: true;
    referral: { include: { partner: true } };
    checklistItems: { include: { itemDef: true } };
  };
}>;
