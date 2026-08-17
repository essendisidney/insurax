import Link from "next/link";
import { INSURAX_IDEA, INSURAX_TAGLINE, modules } from "@/lib/modules";

export default function Home() {
  return (
    <div className="min-h-screen atmosphere text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <div className="brand-mark text-3xl tracking-[0.08em] text-forest">InsuraX</div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-mute transition hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-forest px-4 py-2.5 text-champagne transition hover:bg-navy"
          >
            Launch console
          </Link>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[78vh] max-w-6xl items-end gap-10 px-6 pb-16 pt-6 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-24">
          <div className="animate-rise">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal">
              {INSURAX_TAGLINE}
            </p>
            <h1 className="brand-mark mt-5 text-6xl leading-[0.95] text-forest md:text-7xl lg:text-8xl">
              InsuraX
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-mute">
              Not just an insurance marketplace. InsuraX is the technology infrastructure that runs an
              insurer, broker, MGA, agent network, or embedded-insurance business end to end.
            </p>
            <p className="mt-4 max-w-lg font-display text-2xl text-forest">{INSURAX_IDEA}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-teal px-5 py-3 text-sm font-medium text-white transition hover:bg-mint"
              >
                Explore the console
              </Link>
              <a
                href="#platform"
                className="rounded-xl border border-line bg-white/60 px-5 py-3 text-sm text-ink transition hover:border-teal"
              >
                View the architecture
              </a>
            </div>
          </div>

          <div className="animate-rise-delay relative min-h-[320px] overflow-hidden rounded-[1.75rem] atmosphere-deep p-8 text-champagne shadow-lift md:min-h-[420px]">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(232,213,163,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(232,213,163,0.08) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Operating system</p>
                <p className="mt-6 font-display text-4xl leading-tight text-white md:text-5xl">
                  One ledger.
                  <br />
                  Every workflow.
                </p>
              </div>
              <div className="mt-10 grid gap-3 text-sm text-champagne/85">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  Quote to certificate in minutes
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  M-Pesa, cards, and partner collections
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  Claims, fraud, and AI decisioning on one book
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="border-t border-line/80 bg-white/50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal">Product architecture</p>
            <h2 className="mt-3 font-display text-4xl text-forest md:text-5xl">Ten products. One platform.</h2>
            <p className="mt-3 max-w-2xl text-mute">
              Built for conventional insurers, takaful operators, MGAs, brokers, and embedded partners —
              Kenya-ready, Africa-first.
            </p>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 lg:grid-cols-5">
              {modules.map((mod) => (
                <div key={mod.slug} className="bg-paper p-5 transition hover:bg-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal">{mod.code}</p>
                  <h3 className="mt-2 font-display text-2xl text-forest">{mod.name.replace("InsuraX ", "")}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{mod.tagline}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="overflow-hidden rounded-[2rem] atmosphere-deep px-8 py-12 text-champagne md:px-12">
              <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Who it runs</p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl text-white md:text-5xl">
                Insurer, broker, MGA, agent network, or embedded insurance — one operating book.
              </h2>
              <p className="mt-4 max-w-xl text-champagne/80">
                Policy admin, risk, claims, pay, fraud, APIs, agency, AI, data, and customer self-service
                share a single source of truth.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex rounded-xl bg-gold px-5 py-3 text-sm font-medium text-ink transition hover:bg-champagne"
              >
                Open the operator console
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
