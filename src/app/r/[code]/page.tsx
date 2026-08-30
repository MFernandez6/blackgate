import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listActiveSources } from "@/lib/sources";
import { PublicIntakeForm } from "@/components/intake/public-intake-form";
import { BlackgateMark } from "@/components/brand/blackgate-mark";
import { UPL_NOTICE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const CODE_TO_SOURCE: Record<string, string> = {
  claimsaver: "referral_claimsaver",
  policyline: "referral_policyline",
  attorney: "referral_attorney",
};

export default async function ReferralLinkPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code.toLowerCase();
  const partner = await prisma.partner.findUnique({
    where: { referralCode: code },
  });
  const sourceSlug = partner
    ? partner.slug === "claimsaver"
      ? "referral_claimsaver"
      : partner.slug === "policyline"
        ? "referral_policyline"
        : "referral_attorney"
    : CODE_TO_SOURCE[code];

  if (!sourceSlug) notFound();

  const sources = await listActiveSources();
  if (!sources.some((s) => s.slug === sourceSlug)) notFound();

  return (
    <div className="min-h-screen bg-brand-navy">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/">
          <BlackgateMark className="font-serif text-lg font-bold tracking-[0.2em] text-brand-gold" />
        </Link>
        <p className="eyebrow">
          {partner ? `Referred by ${partner.name}` : "Referral intake"}
        </p>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="font-serif text-3xl text-brand-gold">
          You were referred to Blackline
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-white/75">
          Your source is pre-filled from this link. You can still change it if
          you found us another way — we never hide the source field.
        </p>
        <div className="mt-8">
          <PublicIntakeForm
            sources={sources}
            presetSource={sourceSlug}
            partnerCode={partner?.referralCode}
          />
        </div>
        <p className="mt-12 text-xs leading-relaxed text-brand-slate">{UPL_NOTICE}</p>
      </main>
    </div>
  );
}
