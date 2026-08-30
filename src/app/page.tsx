import Link from "next/link";
import { BlackgateMark } from "@/components/brand/blackgate-mark";
import { Button } from "@/components/ui/button";
import { UPL_NOTICE } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -10%, rgba(232,184,74,0.12), transparent)",
        }}
      />
      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <BlackgateMark className="font-serif text-xl font-bold tracking-[0.2em] text-brand-gold" />
        <Link
          href="/login"
          className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate hover:text-brand-gold"
        >
          Staff portal
        </Link>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <p className="eyebrow mb-4">The front door</p>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-brand-gold sm:text-5xl">
          Every claim enters BLACKLINE through this gate.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-white/80">
          Whether you were referred by ClaimSaver+ or thePolicyLine, sent by an
          attorney, or found us on your own — start here. This is an intake
          request, not a representation agreement.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="amber" size="lg">
            <Link href="/intake">Begin intake</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Gatekeeper sign in</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            ["01", "Tell us how you found us", "Source is required on every path — not just referral links."],
            ["02", "Share what you know", "Contact, loss, and any documents you already have."],
            ["03", "We review the file", "A gatekeeper accepts, declines, or asks for more before a claim is opened."],
          ].map(([n, title, copy]) => (
            <div key={n} className="panel p-4">
              <p className="font-mono text-[10px] text-brand-amber">{n}</p>
              <p className="mt-2 font-serif text-lg text-brand-gold">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-white/70">{copy}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 text-xs leading-relaxed text-brand-slate">{UPL_NOTICE}</p>
        <p className="mt-4 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-brand-slate">
          Operated for Blackline Public Adjusters LLC
        </p>
      </main>
    </div>
  );
}
