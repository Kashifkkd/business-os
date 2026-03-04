import type { IndustryType } from "@/lib/supabase/types";

export type DemoProductSeed = {
  name: string;
  description: string | null;
  unit_price: number;
  currency: string | null;
};

export type DemoDealSeed = {
  name: string;
  stageIndex: number;
  value: number;
  probability: number | null;
  leadIndex?: number | null;
};

export type DemoDealActivitySeed = {
  dealIndex: number;
  type: "note" | "email" | "call" | "status_change";
  content: string | null;
};

const CAFE_PRODUCTS: DemoProductSeed[] = [
  { name: "POS license (annual)", description: "Full POS software license per location.", unit_price: 1200, currency: "USD" },
  { name: "Inventory module add-on", description: "Inventory tracking and reorder alerts.", unit_price: 400, currency: "USD" },
  { name: "Staff training (4h)", description: "On-site training session.", unit_price: 350, currency: "USD" },
  { name: "Multi-location pack", description: "Up to 5 locations.", unit_price: 3600, currency: "USD" },
  { name: "Support plan (premium)", description: "Priority support and SLA.", unit_price: 199, currency: "USD" },
];

const REAL_ESTATE_PRODUCTS: DemoProductSeed[] = [
  { name: "Listing fee (standard)", description: "Standard listing and marketing package.", unit_price: 2500, currency: "USD" },
  { name: "Listing fee (premium)", description: "Premium listing with video and staging.", unit_price: 5000, currency: "USD" },
  { name: "Buyer representation", description: "Buyer-side commission.", unit_price: 0, currency: "USD" },
  { name: "Consultation (1h)", description: "One-time consultation.", unit_price: 150, currency: "USD" },
  { name: "Property management (monthly)", description: "Monthly management fee.", unit_price: 299, currency: "USD" },
];

const GENERIC_PRODUCTS: DemoProductSeed[] = [
  { name: "Starter plan", description: "Entry-level plan.", unit_price: 99, currency: "USD" },
  { name: "Professional plan", description: "For growing teams.", unit_price: 299, currency: "USD" },
  { name: "Enterprise plan", description: "Full features and support.", unit_price: 799, currency: "USD" },
];

export function getDemoProductsForIndustry(industry: IndustryType): DemoProductSeed[] {
  if (industry === "cafe") return CAFE_PRODUCTS;
  if (industry === "real_estate") return REAL_ESTATE_PRODUCTS;
  return GENERIC_PRODUCTS;
}

const CAFE_DEALS: DemoDealSeed[] = [
  { name: "POS + Inventory rollout", stageIndex: 0, value: 12000, probability: 40 },
  { name: "Multi-location cafe expansion", stageIndex: 1, value: 24000, probability: 60 },
  { name: "Downtown bistro – new location", stageIndex: 0, value: 8000, probability: 30, leadIndex: 2 },
  { name: "Sunrise Cafe – annual renewal", stageIndex: 2, value: 1800, probability: 80, leadIndex: 4 },
  { name: "Riverside Cafe – add-on modules", stageIndex: 1, value: 2400, probability: 50, leadIndex: 8 },
  { name: "Spice Route – full suite", stageIndex: 3, value: 5200, probability: 100 },
  { name: "Urban Bistro – training only", stageIndex: 0, value: 700, probability: 25 },
  { name: "Harbor Homes cafe division", stageIndex: 1, value: 15000, probability: 45 },
];

const REAL_ESTATE_DEALS: DemoDealSeed[] = [
  { name: "Downtown loft listing", stageIndex: 0, value: 350000, probability: 40 },
  { name: "Suburban family home purchase", stageIndex: 1, value: 550000, probability: 60 },
  { name: "Ocean View Blvd – listing", stageIndex: 2, value: 1850000, probability: 75 },
  { name: "Mixed-use Redwood Ave", stageIndex: 1, value: 4200000, probability: 50 },
  { name: "Napa land parcel", stageIndex: 0, value: 450000, probability: 30 },
  { name: "Berkeley Craftsman – buyer", stageIndex: 3, value: 1200000, probability: 100 },
  { name: "San Jose office building", stageIndex: 2, value: 2800000, probability: 65 },
  { name: "Sonoma vineyard land", stageIndex: 0, value: 1200000, probability: 25 },
];

const GENERIC_DEALS: DemoDealSeed[] = [
  { name: "Enterprise deal A", stageIndex: 0, value: 25000, probability: 40 },
  { name: "Enterprise deal B", stageIndex: 1, value: 18000, probability: 60 },
  { name: "SMB deal", stageIndex: 2, value: 5000, probability: 80 },
];

export function getDemoDealsForIndustry(industry: IndustryType): DemoDealSeed[] {
  if (industry === "cafe") return CAFE_DEALS;
  if (industry === "real_estate") return REAL_ESTATE_DEALS;
  return GENERIC_DEALS;
}

export const DEMO_DEAL_ACTIVITIES: DemoDealActivitySeed[] = [
  { dealIndex: 0, type: "call", content: "Initial discovery call. Confirmed budget and timeline." },
  { dealIndex: 0, type: "note", content: "Send proposal and case study by EOW." },
  { dealIndex: 1, type: "email", content: "Sent proposal. Follow up in 3 days." },
  { dealIndex: 1, type: "call", content: "Reviewed proposal. Minor edits requested." },
  { dealIndex: 2, type: "note", content: "Lead interested in multi-location. Schedule demo." },
  { dealIndex: 3, type: "status_change", content: "Moved to Negotiation after contract review." },
  { dealIndex: 4, type: "call", content: "Discussed add-on modules. Sending quote." },
];
