import type {
  ClaimType,
  IntakeStatus,
  LossType,
  Occupancy,
  PreferredContactMethod,
  TriageOutcome,
  ChecklistItemStatus,
} from "@/lib/types";

export const UPL_NOTICE =
  "Blackline Public Adjusters LLC is a licensed public adjusting firm. We are not a law firm and do not provide legal advice. Submitting this form does not create a representation relationship. Representation begins only after a licensed public adjuster accepts the matter and you sign a written agreement. You may handle your claim yourself or consult an attorney of your choosing.";

export const ENGAGEMENT_DISCLOSURE =
  "I understand that Blackline Public Adjusters LLC is a public adjusting firm, not a law firm; that this submission is an intake request only; that no one at Blackline will give me legal advice; and that I am not obligated to hire Blackline unless I later sign a written public-adjuster contract.";

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  PROPERTY: "Property",
  PIP: "PIP / auto no-fault",
  DENIED_CLAIM: "Denied claim",
};

export const STATUS_LABELS: Record<IntakeStatus, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In review",
  NEEDS_INFO: "Needs info",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  PROMOTED: "Promoted",
};

export const LOSS_TYPE_LABELS: Record<LossType, string> = {
  WIND: "Hurricane / wind / storm",
  FIRE: "Fire / smoke",
  WATER: "Water / plumbing",
  HAIL: "Hail",
  VANDALISM: "Theft / vandalism",
  AUTO: "Auto / accident",
  OTHER: "Other / not sure",
};

export const OCCUPANCY_LABELS: Record<Occupancy, string> = {
  OWNER: "Owner-occupied",
  RENTER: "Renter / tenant",
  OTHER: "Other",
};

export const CONTACT_LABELS: Record<PreferredContactMethod, string> = {
  EMAIL: "Email",
  PHONE: "Phone",
  TEXT: "Text",
};

export const TRIAGE_LABELS: Record<TriageOutcome, string> = {
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  NEEDS_INFO: "Needs info",
};

export const CHECKLIST_STATUS_LABELS: Record<ChecklistItemStatus, string> = {
  MISSING: "Missing",
  COLLECTED: "Collected",
  TO_BE_GENERATED: "To be generated",
  FLAGGED_FIELD: "Field task",
  WAIVED: "Waived",
  NOT_APPLICABLE: "N/A",
};

export const REASON_CODES = [
  { value: "COVERAGE_FIT", label: "Coverage and loss appear to fit" },
  { value: "INSUFFICIENT_DOCS", label: "Insufficient documents" },
  { value: "OUTSIDE_LICENSE", label: "Outside licensed territory / line" },
  { value: "STATUTE_CONCERN", label: "Timing / statute concern" },
  { value: "DUPLICATE", label: "Duplicate of existing file" },
  { value: "CLAIMANT_WITHDREW", label: "Claimant withdrew" },
  { value: "NOT_A_PA_MATTER", label: "Not a public-adjusting matter" },
  { value: "OTHER", label: "Other" },
] as const;

export const OPEN_GATE_STATUSES: IntakeStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "NEEDS_INFO",
];

export const CLOSED_GATE_STATUSES: IntakeStatus[] = [
  "ACCEPTED",
  "DECLINED",
  "PROMOTED",
];
