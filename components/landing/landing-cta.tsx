"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type LandingCtaProps = {
  isAuthenticated: boolean;
};

export function LandingCta({ isAuthenticated }: LandingCtaProps) {
  return (
    <section className="border-t border-[var(--landing-border)] px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--landing-fg)] sm:text-4xl">
          Ready to run better?
        </h2>
        <p className="mt-4 text-[var(--landing-fg-muted)]">
          Join teams that use Business OS to unify operations, finance, and growth.
        </p>
        <div className="mt-8">
          {isAuthenticated ? (
            <Button
              asChild
              size="lg"
              className="h-11 bg-[var(--landing-accent-gold)] px-8 text-base font-semibold text-[#0c1222] hover:bg-[var(--landing-accent-gold-hover)] focus-visible:ring-2 focus-visible:ring-[var(--landing-accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-bg)]"
            >
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              className="h-11 bg-[var(--landing-accent-gold)] px-8 text-base font-semibold text-[#0c1222] hover:bg-[var(--landing-accent-gold-hover)] focus-visible:ring-2 focus-visible:ring-[var(--landing-accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-bg)]"
            >
              <Link href="/signup">Start free trial</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
