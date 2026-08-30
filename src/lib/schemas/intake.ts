import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const claimTypeEnum = z.enum(["PROPERTY", "PIP", "DENIED_CLAIM"]);
export const occupancyEnum = z.enum(["OWNER", "RENTER", "OTHER"]);
export const contactEnum = z.enum(["EMAIL", "PHONE", "TEXT"]);
export const lossTypeEnum = z.enum([
  "WIND",
  "FIRE",
  "WATER",
  "HAIL",
  "VANDALISM",
  "AUTO",
  "OTHER",
]);
export const triageOutcomeEnum = z.enum(["ACCEPTED", "DECLINED", "NEEDS_INFO"]);
export const checklistStatusEnum = z.enum([
  "MISSING",
  "COLLECTED",
  "TO_BE_GENERATED",
  "FLAGGED_FIELD",
  "WAIVED",
  "NOT_APPLICABLE",
]);

const optionalText = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() ? v.trim() : null));

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

export const publicIntakeSchema = z.object({
  sourceSlug: z.string().min(1, "Tell us how you heard about us"),
  sourceDetail: optionalText,
  campaignName: optionalText,
  claimType: claimTypeEnum,
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Phone is required"),
  preferredContactMethod: contactEnum,
  mailingAddress: optionalText,
  dateOfLoss: optionalText,
  lossType: z.preprocess(emptyToUndefined, lossTypeEnum.optional()),
  lossDescription: optionalText,
  propertyAddress: optionalText,
  city: optionalText,
  zipCode: optionalText,
  county: optionalText,
  occupancy: z.preprocess(emptyToUndefined, occupancyEnum.optional()),
  policyNumber: optionalText,
  carrierName: optionalText,
  insurerClaimNumber: optionalText,
  priorClaimNumber: optionalText,
  priorAdjusterName: optionalText,
  priorAdjusterPhone: optionalText,
  accidentLocation: optionalText,
  injuryDescription: optionalText,
  vehicleYear: optionalText,
  vehicleMake: optionalText,
  vehicleModel: optionalText,
  denialDate: optionalText,
  denialReason: optionalText,
  mortgageeName: optionalText,
  ownershipProofNote: optionalText,
  referringContact: optionalText,
  referringEmail: optionalText,
  referringPhone: optionalText,
  disclosureAccepted: z
    .union([z.boolean(), z.literal("true"), z.literal("on"), z.literal("1")])
    .transform((v) => v === true || v === "true" || v === "on" || v === "1"),
  disclosureName: z.string().min(2, "Type your full name to acknowledge the disclosure"),
});

export const staffIntakeSchema = publicIntakeSchema.extend({
  feeTerms: optionalText,
  feePercent: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = typeof v === "string" ? Number(v) : v;
      return Number.isFinite(n) ? n : null;
    }),
});

export const triageSchema = z.object({
  intakeId: z.string().min(1),
  outcome: triageOutcomeEnum,
  reasonCode: z.string().min(1, "Select a reason code"),
  reasonNote: optionalText,
});

export const checklistUpdateSchema = z.object({
  itemId: z.string().min(1),
  status: checklistStatusEnum,
  note: optionalText,
});

export const webhookIntakeSchema = z.object({
  source: z.string().optional(),
  claimType: claimTypeEnum.optional().default("PROPERTY"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  preferredContactMethod: contactEnum.optional().default("PHONE"),
  propertyAddress: optionalText,
  zip: optionalText,
  zipCode: optionalText,
  city: optionalText,
  county: optionalText,
  damageType: optionalText,
  lossType: lossTypeEnum.optional(),
  dateOfLoss: optionalText,
  dateOfAccident: optionalText,
  lossDescription: optionalText,
  policyNumber: optionalText,
  carrierName: optionalText,
  insuranceCompany: optionalText,
  insurerClaimNumber: optionalText,
  fileNumber: optionalText,
  occupancy: occupancyEnum.optional(),
  referringContact: optionalText,
  referringEmail: optionalText,
  campaignName: optionalText,
  sourceDetail: optionalText,
  worksheet: z.record(z.unknown()).optional(),
});

export type PublicIntakeInput = z.infer<typeof publicIntakeSchema>;
export type StaffIntakeInput = z.infer<typeof staffIntakeSchema>;
export type TriageInput = z.infer<typeof triageSchema>;
export type WebhookIntakeInput = z.infer<typeof webhookIntakeSchema>;
