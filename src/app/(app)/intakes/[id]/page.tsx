import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canPromote, canTriage, canEditIntake } from "@/lib/auth-client";
import { checklistProgress } from "@/lib/checklists";
import {
  CLAIM_TYPE_LABELS,
  CONTACT_LABELS,
  LOSS_TYPE_LABELS,
  OCCUPANCY_LABELS,
} from "@/lib/constants";
import { formatDate, formatDateTime, fullName } from "@/lib/utils";
import { GateStatus } from "@/components/intake/gate-status";
import { ChecklistTracker } from "@/components/intake/checklist-tracker";
import { TriagePanel } from "@/components/triage/triage-panel";
import { Badge } from "@/components/ui/badge";

export default async function IntakeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session?.user) notFound();

  const intake = await prisma.intake.findUnique({
    where: { id: params.id },
    include: {
      source: true,
      createdBy: true,
      referral: { include: { partner: true } },
      decisions: { include: { decidedBy: true }, orderBy: { decidedAt: "desc" } },
      documents: true,
      checklistItems: {
        include: { itemDef: true, documents: true },
        orderBy: { itemDef: { sortOrder: "asc" } },
      },
      handoffs: { include: { performedBy: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!intake) notFound();

  const progress = checklistProgress(intake.checklistItems);
  const role = session.user.role;

  const facts: Array<[string, string]> = [
    ["Type", CLAIM_TYPE_LABELS[intake.claimType as keyof typeof CLAIM_TYPE_LABELS]],
    ["Source", intake.source.label],
    ["Contact", CONTACT_LABELS[intake.preferredContactMethod as keyof typeof CONTACT_LABELS]],
    ["Phone", intake.phone],
    ["Email", intake.email],
    ["Property", intake.propertyAddress ?? "—"],
    ["City / ZIP", [intake.city, intake.zipCode].filter(Boolean).join(" ") || "—"],
    ["County", intake.county ?? "—"],
    ["Occupancy", intake.occupancy ? OCCUPANCY_LABELS[intake.occupancy as keyof typeof OCCUPANCY_LABELS] : "—"],
    ["Date of loss", formatDate(intake.dateOfLoss)],
    ["Loss type", intake.lossType ? LOSS_TYPE_LABELS[intake.lossType as keyof typeof LOSS_TYPE_LABELS] : "—"],
    ["Carrier", intake.carrierName ?? "—"],
    ["Policy #", intake.policyNumber ?? "—"],
    ["Carrier claim #", intake.insurerClaimNumber ?? "—"],
    ["Mortgagee", intake.mortgageeName ?? "—"],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{intake.intakeNumber}</p>
          <h1 className="mt-2 font-serif text-3xl text-brand-gold">
            {fullName(intake.firstName, intake.lastName)}
          </h1>
          <p className="mt-2 text-sm text-brand-white/70">
            Submitted {formatDateTime(intake.submittedAt)}
            {intake.createdBy ? ` · entered by ${intake.createdBy.name}` : " · public form"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <GateStatus status={intake.status as import("@/lib/types").IntakeStatus} />
          <Badge tone="amber">
            Checklist {progress.collected}/{progress.total}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="panel p-5">
            <p className="eyebrow mb-4">File facts</p>
            <dl className="grid gap-3 sm:grid-cols-2">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="eyebrow">{label}</dt>
                  <dd className="mt-1 text-sm text-brand-white/90">{value}</dd>
                </div>
              ))}
            </dl>
            {intake.lossDescription ? (
              <div className="mt-5">
                <p className="eyebrow">Narrative</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-white/80">
                  {intake.lossDescription}
                </p>
              </div>
            ) : null}
          </section>

          <section className="panel p-5">
            <ChecklistTracker
              intakeId={intake.id}
              items={intake.checklistItems.map((item) => ({
                ...item,
                status: item.status as import("@/lib/types").ChecklistItemStatus,
              }))}
              canEdit={canEditIntake(role as import("@/lib/types").StaffRole)}
            />
          </section>
        </div>

        <div className="space-y-6">
          <TriagePanel
            intakeId={intake.id}
            status={intake.status}
            canTriage={canTriage(role as import("@/lib/types").StaffRole)}
            canPromote={canPromote(role as import("@/lib/types").StaffRole)}
            checklistComplete={progress.complete}
          />

          {intake.referral ? (
            <section className="panel p-5">
              <p className="eyebrow mb-3">Referral</p>
              <p className="text-sm text-brand-white/85">
                {intake.referral.partner?.name ?? "Unassigned partner"}
              </p>
              <p className="mt-1 text-xs text-brand-slate">
                {intake.referral.referringContact ?? "No referring contact on file"}
              </p>
              {intake.referral.feeTerms ? (
                <p className="mt-3 text-sm text-brand-amber">{intake.referral.feeTerms}</p>
              ) : null}
              {intake.source.feeBearing ? (
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-brand-gold">
                  Tagged for BLACKLEDGER
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="panel p-5">
            <p className="eyebrow mb-3">Triage history</p>
            {intake.decisions.length === 0 ? (
              <p className="text-sm text-brand-slate">No decision yet.</p>
            ) : (
              <ul className="space-y-3">
                {intake.decisions.map((d) => (
                  <li key={d.id} className="text-sm">
                    <p className="text-brand-white/90">
                      {d.outcome.replace("_", " ")} · {d.reasonCode}
                    </p>
                    <p className="text-xs text-brand-slate">
                      {d.decidedBy.name} · {formatDateTime(d.decidedAt)}
                    </p>
                    {d.reasonNote ? (
                      <p className="mt-1 text-xs text-brand-white/70">{d.reasonNote}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel p-5">
            <p className="eyebrow mb-3">Handoff log</p>
            {intake.handoffs.length === 0 ? (
              <p className="text-sm text-brand-slate">Not promoted yet.</p>
            ) : (
              <ul className="space-y-3">
                {intake.handoffs.map((h) => (
                  <li key={h.id} className="text-sm">
                    <p className="text-brand-white/90">
                      {h.status} {h.blackboxClaimNumber ? `· ${h.blackboxClaimNumber}` : ""}
                    </p>
                    <p className="text-xs text-brand-slate">
                      {h.performedBy?.name ?? "System"} · {formatDateTime(h.createdAt)}
                    </p>
                    {h.errorMessage ? (
                      <p className="mt-1 text-xs text-denied">{h.errorMessage}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
