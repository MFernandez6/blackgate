import { PublicIntakeForm } from "@/components/intake/public-intake-form";
import { BlacklineMark } from "@/components/brand/blackline-mark";
import { listActiveSources } from "@/lib/sources";

export const dynamic = "force-dynamic";

export default async function EmbedPage({
  searchParams,
}: {
  searchParams: { src?: string };
}) {
  const sources = await listActiveSources();
  const preset = sources.some((s) => s.slug === searchParams.src)
    ? searchParams.src
    : "";

  return (
    <div className="min-h-screen bg-brand-navy px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <BlacklineMark size={24} />
          <span className="font-serif text-base font-bold tracking-[0.18em] text-brand-gold">
            BLACKLINE
          </span>
        </span>
        <p className="eyebrow">Embedded intake</p>
      </div>
      <PublicIntakeForm
        sources={sources}
        presetSource={preset}
        lockSource={Boolean(preset)}
        embed
      />
    </div>
  );
}
