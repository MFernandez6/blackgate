import type { ClaimType } from "@/lib/types";
import { UPL_NOTICE } from "@/lib/constants";

export type FormField = {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "textarea" | "select";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  help?: string;
};

export type FormSection = {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
};

export type DynamicFormSchema = {
  sections: FormSection[];
};

const CONTACT_SECTION: FormSection = {
  id: "contact",
  title: "Your contact information",
  description:
    "Used only to reach you about this intake. We will not sell your information.",
  fields: [
    { id: "firstName", label: "First name", type: "text", required: true },
    { id: "lastName", label: "Last name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "phone", label: "Phone", type: "tel", required: true },
    {
      id: "preferredContactMethod",
      label: "Preferred contact",
      type: "select",
      required: true,
      options: [
        { value: "PHONE", label: "Phone" },
        { value: "EMAIL", label: "Email" },
        { value: "TEXT", label: "Text" },
      ],
    },
    { id: "mailingAddress", label: "Mailing address", type: "text" },
  ],
};

const LOSS_OPTIONS = [
  { value: "WIND", label: "Hurricane / wind / storm" },
  { value: "FIRE", label: "Fire / smoke" },
  { value: "WATER", label: "Water / plumbing" },
  { value: "HAIL", label: "Hail" },
  { value: "VANDALISM", label: "Theft / vandalism" },
  { value: "OTHER", label: "Other / not sure" },
];

export const FORM_SCHEMAS: Record<ClaimType, DynamicFormSchema> = {
  PROPERTY: {
    sections: [
      CONTACT_SECTION,
      {
        id: "loss",
        title: "Property and loss",
        fields: [
          { id: "propertyAddress", label: "Property address", type: "text", required: true },
          { id: "city", label: "City", type: "text", required: true },
          { id: "zipCode", label: "ZIP", type: "text", required: true },
          { id: "county", label: "County", type: "text", required: true },
          {
            id: "occupancy",
            label: "Occupancy",
            type: "select",
            required: true,
            options: [
              { value: "OWNER", label: "I own this property" },
              { value: "RENTER", label: "I rent / lease this property" },
              { value: "OTHER", label: "Other" },
            ],
          },
          { id: "dateOfLoss", label: "Date of loss", type: "date", required: true },
          {
            id: "lossType",
            label: "Type of damage",
            type: "select",
            required: true,
            options: LOSS_OPTIONS,
          },
          {
            id: "lossDescription",
            label: "What happened",
            type: "textarea",
            required: true,
            help: "A short factual description. You do not need to argue coverage here.",
          },
          { id: "mortgageeName", label: "Mortgage / lienholder (if any)", type: "text" },
        ],
      },
      {
        id: "policy",
        title: "Policy and prior claim (if known)",
        description: "Skip any field you do not have. Staff can collect it later.",
        fields: [
          { id: "carrierName", label: "Insurance company", type: "text" },
          { id: "policyNumber", label: "Policy number", type: "text" },
          { id: "insurerClaimNumber", label: "Carrier claim number", type: "text" },
          { id: "priorClaimNumber", label: "Prior claim number (if any)", type: "text" },
          { id: "priorAdjusterName", label: "Carrier adjuster name", type: "text" },
          { id: "priorAdjusterPhone", label: "Carrier adjuster phone", type: "text" },
        ],
      },
    ],
  },
  PIP: {
    sections: [
      CONTACT_SECTION,
      {
        id: "accident",
        title: "Accident details",
        fields: [
          { id: "dateOfLoss", label: "Date of accident", type: "date", required: true },
          { id: "accidentLocation", label: "Where it happened", type: "text", required: true },
          {
            id: "lossDescription",
            label: "What happened",
            type: "textarea",
            required: true,
          },
          {
            id: "injuryDescription",
            label: "Injuries (if any)",
            type: "textarea",
            help: "Factual only. This is not a medical or legal evaluation.",
          },
          { id: "vehicleYear", label: "Vehicle year", type: "text" },
          { id: "vehicleMake", label: "Vehicle make", type: "text" },
          { id: "vehicleModel", label: "Vehicle model", type: "text" },
        ],
      },
      {
        id: "policy",
        title: "Auto policy (if known)",
        fields: [
          { id: "carrierName", label: "Insurance company", type: "text" },
          { id: "policyNumber", label: "Policy number", type: "text" },
          { id: "insurerClaimNumber", label: "Carrier claim / file number", type: "text" },
        ],
      },
    ],
  },
  DENIED_CLAIM: {
    sections: [
      CONTACT_SECTION,
      {
        id: "denial",
        title: "Denied claim",
        description:
          "If you already have a denial, reservation of rights, or underpayment letter, you can upload it on the next step.",
        fields: [
          { id: "propertyAddress", label: "Property or risk address", type: "text", required: true },
          { id: "city", label: "City", type: "text" },
          { id: "zipCode", label: "ZIP", type: "text" },
          { id: "county", label: "County", type: "text" },
          { id: "dateOfLoss", label: "Date of loss", type: "date", required: true },
          {
            id: "lossType",
            label: "Type of damage",
            type: "select",
            options: LOSS_OPTIONS,
          },
          { id: "lossDescription", label: "What happened", type: "textarea", required: true },
          { id: "denialDate", label: "Date of denial / ROR", type: "date" },
          { id: "denialReason", label: "What the carrier said", type: "textarea" },
          { id: "carrierName", label: "Insurance company", type: "text" },
          { id: "policyNumber", label: "Policy number", type: "text" },
          { id: "insurerClaimNumber", label: "Carrier claim number", type: "text" },
        ],
      },
    ],
  },
};

export function formSchemaFor(claimType: ClaimType): DynamicFormSchema {
  return FORM_SCHEMAS[claimType];
}

export function formJsonFor(claimType: ClaimType): string {
  return JSON.stringify(FORM_SCHEMAS[claimType]);
}

export function uplNoticeFor(_claimType: ClaimType): string {
  return UPL_NOTICE;
}
