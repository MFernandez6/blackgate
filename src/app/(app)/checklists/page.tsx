import { prisma } from "@/lib/prisma";
import { CLAIM_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ChecklistsPage() {
  const templates = await prisma.checklistTemplate.findMany({
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { claimType: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Configuration</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-gold">
          Intake document checklists
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-white/70">
          Requirements are data, not hardcoded UI. Add a ChecklistItemDef row
          (or a new IntakeSource) without a schema migration. Templates below
          are the seeded defaults per claim type.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {templates.map((template) => (
          <section key={template.id} className="panel p-5">
            <p className="eyebrow">{CLAIM_TYPE_LABELS[template.claimType as keyof typeof CLAIM_TYPE_LABELS]}</p>
            <h2 className="mt-2 font-serif text-xl text-brand-gold">{template.name}</h2>
            <ul className="mt-4 space-y-3">
              {template.items.map((item) => (
                <li key={item.id} className="border-t border-brand-white/10 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-brand-white">{item.label}</p>
                    {item.required ? <Badge tone="amber">Required</Badge> : <Badge>Optional</Badge>}
                    {item.appliesWhen !== "ALL" ? (
                      <Badge>{item.appliesWhen}</Badge>
                    ) : null}
                  </div>
                  {item.helpText ? (
                    <p className="mt-1 text-xs text-brand-slate">{item.helpText}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
