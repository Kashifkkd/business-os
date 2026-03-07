"use client";

import { useUser } from "@/hooks/use-user";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingProductGlimpse } from "@/components/landing/landing-product-glimpse";
import { LandingStats } from "@/components/landing/landing-stats";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingSocialProof } from "@/components/landing/landing-social-proof";

export default function HomePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div
        data-theme="landing"
        className="flex min-h-screen flex-col bg-[var(--landing-bg)]"
      >
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-48 animate-pulse rounded bg-[var(--landing-bg-elevated)]" />
        </div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div
      data-theme="landing"
      className="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-fg)]"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--landing-bg-elevated)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--landing-fg)] focus:ring-2 focus:ring-[var(--landing-accent-blue)]"
      >
        Skip to main content
      </a>
      <LandingNav isAuthenticated={isAuthenticated} />
      <main id="main">
        <LandingHero isAuthenticated={isAuthenticated} />
        <LandingSocialProof />
        <LandingFeatures />
        <LandingProductGlimpse />
        <LandingStats />
        <LandingCta isAuthenticated={isAuthenticated} />
        <LandingFooter />
      </main>
    </div>
  );
}
