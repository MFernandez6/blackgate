import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { checklistProgress } from "@/lib/checklists";
import { CLAIM_TYPE_LABELS } from "@/lib/constants";
import { daysOpen, formatDate, fullName } from "@/lib/utils";
import { GateStatus } from "@/components/intake/gate-status";
import { Badge } from "@/components/ui/badge";
import type { IntakeStatus } from "@/lib/types";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: { status?: string; source?: string };
}) {
  const status = searchParams.status as IntakeStatus | undefined;
  const intakes = await prisma.intake.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(searchParams.source ? { source: { slug: searchParams.source } } : {}),
    },
    include: {
      source: true,
      checklistItems: { include: { itemDef: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const open = intakes.filter((i) =>
    ["SUBMITTED", "IN_REVIEW", "NEEDS_INFO"].includes(i.status)
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Triage queue</p>
          <h1 className="mt-2 font-serif text-3xl text-brand-gold">Gatekeeper review</h1>
          <p className="mt-2 text-sm text-brand-white/70">
            {open} gate{open === 1 ? "" : "s"} open · {intakes.length} shown
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["", "All"],
            ["SUBMITTED", "Submitted"],
            ["IN_REVIEW", "In review"],
            ["NEEDS_INFO", "Needs info"],
            ["ACCEPTED", "Accepted"],
            ["DECLINED", "Declined"],
            ["PROMOTED", "Promoted"],
          ].map(([value, label]) => (
            <Link
              key={value || "all"}
              href={value ? `/queue?status=${value}` : "/queue"}
              className={`border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] ${
                (searchParams.status ?? "") === value
                  ? "border-brand-amber text-brand-amber"
                  : "border-brand-white/15 text-brand-slate hover:text-brand-gold"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-brand-white/10">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-brand-white/10 bg-brand-navy-deep/60">
            <tr className="eyebrow">
              <th className="px-4 py-3">Intake</th>
              <th className="px-4 py-3">Claimant</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Checklist</th>
              <th className="px-4 py-3">Gate</th>
              <th className="px-4 py-3">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-white/10">
            {intakes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-brand-slate">
                  No intakes in this view.
                </td>
              </tr>
            ) : (
              intakes.map((intake) => {
                const progress = checklistProgress(intake.checklistItems);
                return (
                  <tr key={intake.id} className="hover:bg-brand-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/intakes/${intake.id}`}
                        className="font-mono text-xs text-brand-gold hover:underline"
                      >
                        {intake.intakeNumber}
                      </Link>
                      <p className="mt-1 text-[11px] text-brand-slate">
                        {formatDate(intake.submittedAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{fullName(intake.firstName, intake.lastName)}</p>
                      <p className="text-[11px] text-brand-slate">{intake.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{CLAIM_TYPE_LABELS[intake.claimType as keyof typeof CLAIM_TYPE_LABELS]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-brand-white/80">{intake.source.label}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-brand-amber">
                          {progress.collected}/{progress.total}
                        </span>
                        <div className="h-1.5 w-16 border border-brand-white/10">
                          <div
                            className="h-full bg-brand-amber"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <GateStatus status={intake.status as import("@/lib/types").IntakeStatus} compact />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-slate">
                      {daysOpen(intake.submittedAt)}d
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
