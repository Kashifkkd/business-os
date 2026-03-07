import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans, Syne } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import "./globals.css";

const notoSans = Noto_Sans({ variable: "--font-sans" });

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Business OS – ERP for modern teams",
  description:
    "One place for operations, finance, and growth. Enterprise power meets modern startup elegance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${notoSans.variable} ${syne.variable} lenis lenis-smooth`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            {/* <SmoothScroll> */}
              <TooltipProvider>{children}</TooltipProvider>
            {/* </SmoothScroll> */}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
