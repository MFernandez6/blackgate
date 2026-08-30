import Link from "next/link";
import { PublicIntakeForm } from "@/components/intake/public-intake-form";
import { BlackgateMark } from "@/components/brand/blackgate-mark";
import { UPL_NOTICE } from "@/lib/constants";
import { listActiveSources } from "@/lib/sources";

export const dynamic = "force-dynamic";

export default async function IntakePage({
  searchParams,
}: {
  searchParams: { src?: string; embed?: string };
}) {
  const sources = await listActiveSources();
  const preset = sources.some((s) => s.slug === searchParams.src)
    ? searchParams.src
    : "";

  return (
    <div className="min-h-screen bg-brand-navy">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/">
          <BlackgateMark className="font-serif text-lg font-bold tracking-[0.2em] text-brand-gold" />
        </Link>
        <p className="eyebrow">Public intake</p>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <p className="eyebrow">Standalone form</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-gold">
          Request an intake review
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-white/75">
          Link this page from ads, business cards, or QR codes. Source is
          always required — even when you arrive without a referral.
        </p>
        <div className="mt-8">
          <PublicIntakeForm sources={sources} presetSource={preset} />
        </div>
        <p className="mt-12 text-xs leading-relaxed text-brand-slate">{UPL_NOTICE}</p>
      </main>
    </div>
  );
}
