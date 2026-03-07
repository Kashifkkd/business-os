"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type LandingHeroProps = {
  isAuthenticated: boolean;
};

export function LandingHero({ isAuthenticated }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:pb-32 lg:pt-32">
      {/* Optional gradient orb for depth */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          width: "min(80vw, 600px)",
          height: "min(80vw, 600px)",
          background: "radial-gradient(circle, var(--landing-accent-blue) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="container relative mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--landing-fg)] sm:text-5xl md:text-6xl lg:text-7xl">
          One system.
          <br />
          <span className="text-[var(--landing-accent-gold)]">Every operation.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--landing-fg-muted)] sm:text-xl">
          Operations, finance, and growth in one place. Enterprise power meets modern startup elegance.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isAuthenticated ? (
            <Button
              asChild
              size="lg"
              className="h-11 bg-[var(--landing-accent-gold)] px-8 text-base font-semibold text-[#0c1222] hover:bg-[var(--landing-accent-gold-hover)] focus-visible:ring-2 focus-visible:ring-[var(--landing-accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-bg)]"
            >
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                size="lg"
                className="h-11 bg-[var(--landing-accent-gold)] px-8 text-base font-semibold text-[#0c1222] hover:bg-[var(--landing-accent-gold-hover)] focus-visible:ring-2 focus-visible:ring-[var(--landing-accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-bg)]"
              >
                <Link href="/signup">Start free trial</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 border-[var(--landing-border)] bg-transparent px-8 text-base font-medium text-[var(--landing-fg)] hover:bg-[var(--landing-bg-elevated)] hover:border-[var(--landing-border-hover)] focus-visible:ring-2 focus-visible:ring-[var(--landing-accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-bg)]"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
