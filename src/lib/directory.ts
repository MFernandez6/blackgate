import { prisma } from "@/lib/prisma";
import type { StaffRole } from "@/lib/types";

type DirectoryRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
};

function mapAdjusterRole(role: string): StaffRole {
  if (role === "ADMIN") return "ADMIN";
  if (role === "VIEWER") return "VIEWER";
  return "GATEKEEPER";
}

async function findAdjuster(email: string): Promise<DirectoryRow | null> {
  try {
    const rows = await prisma.$queryRaw<DirectoryRow[]>`
      SELECT id, name, email, "passwordHash", role, "isActive"
      FROM public."Adjuster"
      WHERE lower(email) = ${email}
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve an employee for BLACKGATE sign-in.
 * Prefer the shared BLACKBOX Adjuster directory, then local Staff.
 * Always return a Staff row so intake FKs stay on BLACKGATE tables.
 */
export async function resolveStaffForLogin(email: string) {
  const normalized = email.toLowerCase();
  const adjuster = await findAdjuster(normalized);

  if (adjuster?.isActive) {
    const role = mapAdjusterRole(adjuster.role);
    const staff = await prisma.staff.upsert({
      where: { email: normalized },
      create: {
        name: adjuster.name,
        email: normalized,
        passwordHash: adjuster.passwordHash,
        role,
        isActive: true,
      },
      update: {
        name: adjuster.name,
        passwordHash: adjuster.passwordHash,
        role,
        isActive: true,
      },
    });
    return {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role as StaffRole,
      passwordHash: adjuster.passwordHash,
    };
  }

  const staff = await prisma.staff.findUnique({
    where: { email: normalized },
  });
  if (!staff || !staff.isActive) return null;

  return {
    id: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role as StaffRole,
    passwordHash: staff.passwordHash,
  };
}
