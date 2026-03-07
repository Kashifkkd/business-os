"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type LandingNavProps = {
  isAuthenticated: boolean;
};

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#" },
];

export function LandingNav({ isAuthenticated }: LandingNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--landing-border)] bg-[var(--landing-bg)]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="font-semibold tracking-tight text-[var(--landing-fg)]"
          style={{ fontFamily: "var(--font-display), var(--font-geist-sans), system-ui, sans-serif" }}
        >
          Business OS
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-md px-2 py-1.5 text-sm text-[var(--landing-fg-muted)] transition-colors hover:text-[var(--landing-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-bg)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              asChild
              className="h-9 bg-[var(--landing-accent-gold)] px-4 text-[#0c1222] font-medium hover:bg-[var(--landing-accent-gold-hover)] focus-visible:ring-2 focus-visible:ring-[var(--landing-accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-bg)]"
            >
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="h-9 text-[var(--landing-fg-muted)] hover:bg-[var(--landing-bg-elevated)] hover:text-[var(--landing-fg)]"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                className="h-9 bg-[var(--landing-accent-gold)] px-4 text-[#0c1222] font-medium hover:bg-[var(--landing-accent-gold-hover)] focus-visible:ring-2 focus-visible:ring-[var(--landing-accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-bg)]"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
