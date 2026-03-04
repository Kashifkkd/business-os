export type DemoTaskLabelSeed = {
  name: string;
  color: string;
  sort_order: number;
};

export type DemoTaskSpaceSeed = {
  name: string;
  description: string;
  sort_order: number;
};

export type DemoTaskListSeed = {
  spaceIndex: number;
  name: string;
  sort_order: number;
};

export type DemoTaskSeed = {
  spaceIndex: number;
  listIndex: number;
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low" | "none";
  /** 0 = To Do, 1 = In Progress, 2 = Done (org default statuses) */
  statusIndex?: number;
};

export const DEMO_TASK_LABELS: DemoTaskLabelSeed[] = [
  { name: "Onboarding", color: "#0ea5e9", sort_order: 0 },
  { name: "Sales", color: "#22c55e", sort_order: 1 },
  { name: "Marketing", color: "#f97316", sort_order: 2 },
  { name: "Finance", color: "#6366f1", sort_order: 3 },
  { name: "Bug", color: "#ef4444", sort_order: 4 },
];

export const DEMO_TASK_SPACES: DemoTaskSpaceSeed[] = [
  { name: "Getting started", description: "Sample project to learn tasks, lists, and statuses.", sort_order: 0 },
  { name: "Sales Pipeline", description: "Tasks tied to deals and follow-ups.", sort_order: 1 },
  { name: "Marketing", description: "Campaigns, content, and launch tasks.", sort_order: 2 },
  { name: "Operations", description: "Internal processes and support.", sort_order: 3 },
];

export const DEMO_TASK_LISTS: DemoTaskListSeed[] = [
  { spaceIndex: 0, name: "Backlog", sort_order: 0 },
  { spaceIndex: 0, name: "In Progress", sort_order: 1 },
  { spaceIndex: 0, name: "Done", sort_order: 2 },
  { spaceIndex: 1, name: "Backlog", sort_order: 0 },
  { spaceIndex: 1, name: "Qualification", sort_order: 1 },
  { spaceIndex: 1, name: "Proposal", sort_order: 2 },
  { spaceIndex: 2, name: "Ideas", sort_order: 0 },
  { spaceIndex: 2, name: "In progress", sort_order: 1 },
  { spaceIndex: 3, name: "Backlog", sort_order: 0 },
  { spaceIndex: 3, name: "Done", sort_order: 1 },
];

export const DEMO_TASKS: DemoTaskSeed[] = [
  { spaceIndex: 0, listIndex: 0, title: "Set up your first space", description: "Use this project as a reference for how tasks, lists, and statuses work.", priority: "none" },
  { spaceIndex: 0, listIndex: 0, title: "Invite your team", description: "Add team members so you can assign tasks and collaborate.", priority: "medium" },
  { spaceIndex: 0, listIndex: 1, title: "Create a sales pipeline view", description: "Align tasks with your sales stages so follow-ups never slip.", priority: "high" },
  { spaceIndex: 0, listIndex: 2, title: "Review demo data", description: "Walk through leads, deals, and tasks to see how everything connects.", priority: "none", statusIndex: 2 },
  { spaceIndex: 1, listIndex: 0, title: "Qualify downtown loft lead", description: "Schedule call and confirm budget and timeline.", priority: "high" },
  { spaceIndex: 1, listIndex: 0, title: "Send proposal to Ocean View prospect", description: "Include pricing and terms.", priority: "medium" },
  { spaceIndex: 1, listIndex: 1, title: "Follow up on POS rollout inquiry", description: "Share case study and schedule demo.", priority: "medium" },
  { spaceIndex: 1, listIndex: 2, title: "Close Multi-location cafe expansion", description: "Finalize contract and handoff to onboarding.", priority: "low", statusIndex: 2 },
  { spaceIndex: 2, listIndex: 0, title: "Draft Q2 newsletter", description: "Outline topics and assign writers.", priority: "medium" },
  { spaceIndex: 2, listIndex: 0, title: "Plan product launch campaign", description: "Define channels, segments, and creatives.", priority: "high" },
  { spaceIndex: 2, listIndex: 1, title: "Configure welcome email journey", description: "Review demo journey and adapt to our brand.", priority: "medium" },
  { spaceIndex: 2, listIndex: 1, title: "A/B test subject lines", description: "Run test on next campaign send.", priority: "low" },
  { spaceIndex: 3, listIndex: 0, title: "Document order fulfillment process", description: "Step-by-step for new hires.", priority: "low" },
  { spaceIndex: 3, listIndex: 0, title: "Audit inventory reorder levels", description: "Update reorder points for top 20 SKUs.", priority: "medium" },
  { spaceIndex: 3, listIndex: 1, title: "Complete Q1 expense reconciliation", description: "Match receipts and submit for close.", priority: "low", statusIndex: 2 },
];
