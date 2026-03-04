import type { IndustryType } from "@/lib/supabase/types";

export type DemoLeadSourceExtraSeed = {
  name: string;
  color?: string;
};

/** Extra lead sources to seed when loading demo data (if tenant has few sources). */
export const DEMO_LEAD_SOURCES_EXTRA: DemoLeadSourceExtraSeed[] = [
  { name: "Event", color: "#7c3aed" },
  { name: "Social", color: "#2563eb" },
  { name: "Partner", color: "#059669" },
];

export type DemoLeadSeed = {
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: string;
  notes: string;
};

const BASE_LEADS: DemoLeadSeed[] = [
  {
    name: "Alex Thompson",
    email: "alex.thompson@example.com",
    phone: "+1 555-0100",
    company: "Downtown Coffee Roasters",
    source: "Website",
    status: "new",
    notes: "Requested a demo of Business OS.",
  },
  {
    name: "Priya Shah",
    email: "priya.shah@example.com",
    phone: "+1 555-0101",
    company: "Seaside Group",
    source: "Referral",
    status: "contacted",
    notes: "Interested in CRM and finance modules.",
  },
  {
    name: "Michael Lee",
    email: "michael.lee@example.com",
    phone: "+1 555-0102",
    company: "Urban Bistro",
    source: "Email campaign",
    status: "qualified",
    notes: "Wants to track menu, inventory, and expenses.",
  },
  {
    name: "Sara Kim",
    email: "sara.kim@example.com",
    phone: "+1 555-0103",
    company: "Greenfield Ventures",
    source: "LinkedIn",
    status: "new",
    notes: "Exploring pipeline and task management.",
  },
  {
    name: "David Martinez",
    email: "david.martinez@example.com",
    phone: "+1 555-0104",
    company: "Sunrise Cafe",
    source: "Event",
    status: "contacted",
    notes: "Met at local business meetup. Needs simple CRM.",
  },
  {
    name: "Emily Chen",
    email: "emily.chen@example.com",
    phone: "+1 555-0105",
    company: "Harbor Homes",
    source: "Facebook Ads",
    status: "qualified",
    notes: "Looking for an integrated sales + marketing stack.",
  },
  {
    name: "Ravi Patel",
    email: "ravi.patel@example.com",
    phone: "+1 555-0106",
    company: "Spice Route Cafe",
    source: "Walk-in",
    status: "proposal",
    notes: "Needs POS, menu, and inventory in one place.",
  },
  {
    name: "Olivia Garcia",
    email: "olivia.garcia@example.com",
    phone: "+1 555-0107",
    company: "Skyline Realty",
    source: "Cold outreach",
    status: "new",
    notes: "Interested in listings, tasks, and finance.",
  },
  {
    name: "Liam Johnson",
    email: "liam.johnson@example.com",
    phone: "+1 555-0108",
    company: "Riverside Cafe",
    source: "Website",
    status: "contacted",
    notes: "Wants better visibility into daily sales.",
  },
  {
    name: "Aisha Khan",
    email: "aisha.khan@example.com",
    phone: "+1 555-0109",
    company: "Prime Estates",
    source: "Partner",
    status: "qualified",
    notes: "Evaluating tools for multi-agent real estate teams.",
  },
];

/** Returns a richer set of demo leads, slightly tailored by industry. */
export function getDemoLeadsForIndustry(industry: IndustryType): DemoLeadSeed[] {
  if (industry === "cafe") {
    return BASE_LEADS.map((lead) => ({
      ...lead,
      company:
        lead.company.includes("Realty") || lead.company.includes("Estates")
          ? `${lead.company} Cafe`
          : lead.company,
    }));
  }

  if (industry === "real_estate") {
    return BASE_LEADS.map((lead) => ({
      ...lead,
      company:
        lead.company.includes("Cafe") || lead.company.includes("Bistro")
          ? `${lead.company} Realty`
          : lead.company,
    }));
  }

  return BASE_LEADS;
}

