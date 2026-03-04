export type DemoMarketingSegmentSeed = {
  name: string;
  description: string | null;
  definition: Record<string, unknown>;
};

export type DemoMarketingTemplateSeed = {
  name: string;
  description: string | null;
  channel: string;
  subject: string | null;
  body: string;
  variables: string[];
};

export type DemoMarketingCampaignSeed = {
  name: string;
  description: string | null;
  objective: string | null;
  status: string;
  primary_channel: string | null;
  segmentIndex: number;
  tags: string[];
};

export type DemoMarketingJourneySeed = {
  name: string;
  description: string | null;
  status: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  /** Steps: each has templateIndex and optional delay_minutes for send_email */
  steps: Array<{ type: string; templateIndex: number; delay_minutes?: number }>;
};

export const DEMO_MARKETING_SEGMENTS: DemoMarketingSegmentSeed[] = [
  {
    name: "All leads",
    description: "Targets every lead in your CRM.",
    definition: { type: "all_leads" },
  },
  {
    name: "Qualified leads",
    description: "Leads marked as qualified.",
    definition: { type: "filter", filters: [{ field: "status", op: "eq", value: "qualified" }] },
  },
  {
    name: "New this week",
    description: "Leads created in the last 7 days.",
    definition: { type: "filter", filters: [{ field: "created_at", op: "gte", value: "7d" }] },
  },
  {
    name: "By source: Website",
    description: "Leads that came from the website.",
    definition: { type: "filter", filters: [{ field: "source", op: "eq", value: "Website" }] },
  },
];

export const DEMO_MARKETING_TEMPLATES: DemoMarketingTemplateSeed[] = [
  {
    name: "Welcome email",
    description: "Simple welcome email for new leads.",
    channel: "email",
    subject: "Welcome to Business OS",
    body: "Hi {{name}},\n\nThanks for checking out Business OS. This is a demo template – edit me to match your brand.",
    variables: ["name"],
  },
  {
    name: "Follow-up email",
    description: "First follow-up after initial contact.",
    channel: "email",
    subject: "Quick follow-up",
    body: "Hi {{name}},\n\nJust following up on our conversation. Let me know if you have any questions.",
    variables: ["name"],
  },
  {
    name: "Monthly newsletter",
    description: "Newsletter template for regular updates.",
    channel: "email",
    subject: "Your monthly update",
    body: "Hi {{name}},\n\nHere’s what’s new this month…\n\nBest,\nThe Team",
    variables: ["name"],
  },
  {
    name: "Promo offer",
    description: "Limited-time offer template.",
    channel: "email",
    subject: "Special offer for you",
    body: "Hi {{name}},\n\nWe have a special offer just for you. Reply to this email to learn more.",
    variables: ["name"],
  },
  {
    name: "SMS reminder",
    description: "Short reminder for appointments or follow-ups.",
    channel: "sms",
    subject: null,
    body: "Hi {{name}}, this is a quick reminder. Reply STOP to opt out.",
    variables: ["name"],
  },
];

export const DEMO_MARKETING_CAMPAIGNS: DemoMarketingCampaignSeed[] = [
  {
    name: "Welcome series",
    description: "A simple campaign to welcome new leads.",
    objective: "onboarding",
    status: "draft",
    primary_channel: "email",
    segmentIndex: 0,
    tags: ["demo", "onboarding"],
  },
  {
    name: "Monthly newsletter",
    description: "Regular newsletter to engaged leads.",
    objective: "engagement",
    status: "draft",
    primary_channel: "email",
    segmentIndex: 1,
    tags: ["newsletter"],
  },
  {
    name: "Product launch",
    description: "Campaign for new product announcement.",
    objective: "awareness",
    status: "draft",
    primary_channel: "email",
    segmentIndex: 0,
    tags: ["launch", "product"],
  },
  {
    name: "Re-engagement",
    description: "Win back inactive leads.",
    objective: "re-engagement",
    status: "draft",
    primary_channel: "email",
    segmentIndex: 2,
    tags: ["re-engagement"],
  },
];

export const DEMO_MARKETING_JOURNEYS: DemoMarketingJourneySeed[] = [
  {
    name: "New lead welcome journey",
    description: "Automatically send a welcome email to new leads.",
    status: "draft",
    trigger_type: "lead_created",
    trigger_config: { source: "any" },
    steps: [{ type: "send_email", templateIndex: 0, delay_minutes: 0 }],
  },
  {
    name: "Lead nurture journey",
    description: "Follow up with new leads after 2 days.",
    status: "draft",
    trigger_type: "lead_created",
    trigger_config: { source: "any" },
    steps: [
      { type: "send_email", templateIndex: 0, delay_minutes: 0 },
      { type: "send_email", templateIndex: 1, delay_minutes: 2880 },
    ],
  },
  {
    name: "Abandoned cart reminder",
    description: "Remind leads who didn’t complete an action.",
    status: "draft",
    trigger_type: "lead_entered_segment",
    trigger_config: { segment_id: "placeholder" },
    steps: [{ type: "send_email", templateIndex: 3, delay_minutes: 1440 }],
  },
];
