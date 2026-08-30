export type StaffRole = "ADMIN" | "GATEKEEPER" | "INTAKE_STAFF" | "VIEWER";

export type ClaimType = "PROPERTY" | "PIP" | "DENIED_CLAIM";

export type IntakeStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "NEEDS_INFO"
  | "ACCEPTED"
  | "DECLINED"
  | "PROMOTED";

export type TriageOutcome = "ACCEPTED" | "DECLINED" | "NEEDS_INFO";

export type Occupancy = "OWNER" | "RENTER" | "OTHER";

export type PreferredContactMethod = "EMAIL" | "PHONE" | "TEXT";

export type LossType =
  | "WIND"
  | "FIRE"
  | "WATER"
  | "HAIL"
  | "VANDALISM"
  | "AUTO"
  | "OTHER";

export type ChecklistItemStatus =
  | "MISSING"
  | "COLLECTED"
  | "TO_BE_GENERATED"
  | "FLAGGED_FIELD"
  | "WAIVED"
  | "NOT_APPLICABLE";

export type HandoffStatus = "PENDING" | "SUCCEEDED" | "FAILED";

export type WebhookStatus = "RECEIVED" | "PROCESSED" | "REJECTED";
