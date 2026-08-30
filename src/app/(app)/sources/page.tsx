import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SourcesPage() {
  const sources = await prisma.intakeSource.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      intakes: {
        select: { id: true, status: true },
      },
    },
  });

  const rows = sources.map((source) => {
    const total = source.intakes.length;
    const promoted = source.intakes.filter((i) => i.status === "PROMOTED").length;
    const accepted = source.intakes.filter((i) =>
      ["ACCEPTED", "PROMOTED"].includes(i.status)
    ).length;
    const declined = source.intakes.filter((i) => i.status === "DECLINED").length;
    const open = source.intakes.filter((i) =>
      ["SUBMITTED", "IN_REVIEW", "NEEDS_INFO"].includes(i.status)
    ).length;
    const conversion = total === 0 ? 0 : Math.round((promoted / total) * 100);
    return { source, total, promoted, accepted, declined, open, conversion };
  });

  const grand = rows.reduce((n, r) => n + r.total, 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Channel performance</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-gold">
          Referral &amp; source dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-white/70">
          Volume and conversion across every entry point — partner referrals
          and organic / direct — because IntakeSource is always populated.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <p className="eyebrow">All sources</p>
          <p className="mt-2 font-serif text-3xl text-brand-gold">{grand}</p>
        </div>
        <div className="panel p-5">
          <p className="eyebrow">Open gates</p>
          <p className="mt-2 font-serif text-3xl text-brand-amber">
            {rows.reduce((n, r) => n + r.open, 0)}
          </p>
        </div>
        <div className="panel p-5">
          <p className="eyebrow">Promoted to BLACKBOX</p>
          <p className="mt-2 font-serif text-3xl text-brand-gold">
            {rows.reduce((n, r) => n + r.promoted, 0)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border border-brand-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-brand-white/10 bg-brand-navy-deep/60">
            <tr className="eyebrow">
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Open</th>
              <th className="px-4 py-3">Accepted</th>
              <th className="px-4 py-3">Declined</th>
              <th className="px-4 py-3">Promoted</th>
              <th className="px-4 py-3">Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-white/10">
            {rows.map((row) => (
              <tr key={row.source.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/queue?source=${row.source.slug}`}
                    className="text-brand-gold hover:underline"
                  >
                    {row.source.label}
                  </Link>
                </td>
                <td className="px-4 py-3 text-brand-slate">
                  {row.source.isReferral
                    ? row.source.feeBearing
                      ? "Referral · fee"
                      : "Referral"
                    : "Direct / organic"}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{row.total}</td>
                <td className="px-4 py-3 font-mono text-xs text-brand-amber">{row.open}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.accepted}</td>
                <td className="px-4 py-3 font-mono text-xs text-denied">{row.declined}</td>
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">{row.promoted}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{row.conversion}%</span>
                    <div className="h-1.5 w-16 border border-brand-white/10">
                      <div
                        className="h-full bg-brand-gold"
                        style={{ width: `${row.conversion}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
