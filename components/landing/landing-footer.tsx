"use client";

import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "Legal", href: "#" },
  { label: "Contact", href: "#" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--landing-border)] px-4 py-10 sm:px-6">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="text-sm text-[var(--landing-fg-muted)]">
          © {new Date().getFullYear()} Business OS. All rights reserved.
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-6">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-md px-2 py-1 text-sm text-[var(--landing-fg-muted)] transition-colors hover:text-[var(--landing-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--landing-bg)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
