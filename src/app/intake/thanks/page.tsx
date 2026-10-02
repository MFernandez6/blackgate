import Link from "next/link";
import { BlacklineLogo } from "@/components/brand/blackline-mark";

export default function ThanksPage({
  searchParams,
}: {
  searchParams: { n?: string; embed?: string };
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <BlacklineLogo className="w-48" priority />
      <p className="eyebrow mt-8">Gate received</p>
      <h1 className="mt-3 font-serif text-3xl text-brand-gold">
        Your intake is on file
      </h1>
      {searchParams.n ? (
        <p className="mt-4 font-mono text-sm text-brand-amber">{searchParams.n}</p>
      ) : null}
      <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-white/75">
        A gatekeeper will review what you submitted. This is not yet a claim
        file and does not mean Blackline represents you. We will contact you
        using the method you chose.
      </p>
      {!searchParams.embed ? (
        <Link
          href="/"
          className="mt-8 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold"
        >
          Return home
        </Link>
      ) : null}
    </div>
  );
}
