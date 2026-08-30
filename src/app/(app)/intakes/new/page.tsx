import { StaffIntakeForm } from "@/components/intake/staff-intake-form";
import { listActiveSources } from "@/lib/sources";

export const dynamic = "force-dynamic";

export default async function NewIntakePage() {
  const sources = await listActiveSources();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Manual entry</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-gold">
          Phone / walk-in intake
        </h1>
        <p className="mt-2 text-sm text-brand-white/70">
          Use this when the claimant is on the line or at the desk. Source is
          still required — typically phone or walk-in.
        </p>
      </div>
      <StaffIntakeForm sources={sources} />
    </div>
  );
}
