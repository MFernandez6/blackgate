import type { StaffRole } from "@/lib/types";

export function canTriage(role: StaffRole): boolean {
  return role === "ADMIN" || role === "GATEKEEPER";
}

export function canEditIntake(role: StaffRole): boolean {
  return role === "ADMIN" || role === "GATEKEEPER" || role === "INTAKE_STAFF";
}

export function canPromote(role: StaffRole): boolean {
  return role === "ADMIN" || role === "GATEKEEPER";
}

export function canManageSettings(role: StaffRole): boolean {
  return role === "ADMIN";
}
