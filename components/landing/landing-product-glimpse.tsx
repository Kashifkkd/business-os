"use client";

export function LandingProductGlimpse() {
  return (
    <section className="border-t border-[var(--landing-border)] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--landing-fg)] sm:text-4xl">
          One place for your business
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--landing-fg-muted)]">
          Dashboards, lists, and workflows that adapt to how you work. Clean, fast, and always in sync.
        </p>
        <div className="mt-12 flex justify-center">
          <div
            className="h-64 w-full max-w-4xl rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-elevated)] sm:h-80"
            style={{
              backgroundImage: `
                linear-gradient(135deg, var(--landing-bg-muted) 0%, var(--landing-bg-elevated) 50%, var(--landing-bg-muted) 100%),
                linear-gradient(to right, var(--landing-border) 1px, transparent 1px),
                linear-gradient(to bottom, var(--landing-border) 1px, transparent 1px)
              `,
              backgroundSize: "100% 100%, 24px 24px, 24px 24px",
            }}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
