"use client";

const STATS = [
  { value: "10k+", label: "Teams" },
  { value: "99.9%", label: "Uptime" },
  { value: "50+", label: "Integrations" },
];

export function LandingStats() {
  return (
    <section className="border-t border-[var(--landing-border)] px-4 py-16 sm:px-6 sm:py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-3 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div
                className="text-3xl font-bold tracking-tight text-[var(--landing-accent-gold)] sm:text-4xl"
                style={{ fontFamily: "var(--font-display), var(--font-geist-sans), system-ui, sans-serif" }}
              >
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-[var(--landing-fg-muted)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
