"use client";

import {
  LayoutGrid,
  Wallet,
  Users,
  BarChart3,
} from "lucide-react";

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Operations",
    description: "Unify inventory, orders, and workflows in one place. Built for speed and clarity.",
  },
  {
    icon: Wallet,
    title: "Finance",
    description: "Chart of accounts, invoicing, expenses, and reporting. Stay in control of the numbers.",
  },
  {
    icon: Users,
    title: "CRM & leads",
    description: "Pipeline, activities, and follow-ups. From first touch to closed deal.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Dashboards and reports that show what matters. Decisions, not guesswork.",
  },
];

export function LandingFeatures() {
  return (
    <section
      id="product"
      className="border-t border-[var(--landing-border)] px-4 py-16 sm:px-6 sm:py-20 lg:py-24"
    >
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--landing-fg)] sm:text-4xl">
          Everything you need to run the business
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--landing-fg-muted)]">
          One platform for operations, finance, and growth. No more switching tabs or losing context.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-elevated)]/50 p-6 transition-colors hover:border-[var(--landing-border-hover)] hover:bg-[var(--landing-bg-elevated)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--landing-accent-gold)]/15 text-[var(--landing-accent-gold)]">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--landing-fg)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--landing-fg-muted)]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
