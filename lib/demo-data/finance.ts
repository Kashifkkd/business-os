export type DemoAccountSeed = {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  subtype?: string | null;
};

export type DemoInvoiceLineSeed = {
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
};

export type DemoInvoiceSeed = {
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "void";
  invoice_date: string;
  due_date: string | null;
  lines: DemoInvoiceLineSeed[];
};

export type DemoExpenseLineSeed = {
  description: string;
  expense_date: string;
  amount: number;
};

export type DemoExpenseReportSeed = {
  employeeIndex: number;
  report_number: string;
  status: "draft" | "submitted" | "approved" | "paid";
  lines: DemoExpenseLineSeed[];
};

/** Minimal chart of accounts for demo. Seed when tenant has no accounts. */
export const DEMO_ACCOUNTS: DemoAccountSeed[] = [
  { code: "1000", name: "Cash", type: "asset", subtype: null },
  { code: "1200", name: "Accounts Receivable", type: "asset", subtype: null },
  { code: "1500", name: "Inventory", type: "asset", subtype: "inventory" },
  { code: "2000", name: "Accounts Payable", type: "liability", subtype: null },
  { code: "2100", name: "Tax Payable", type: "liability", subtype: null },
  { code: "3000", name: "Equity", type: "equity", subtype: null },
  { code: "4000", name: "Revenue", type: "income", subtype: null },
  { code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: null },
  { code: "6100", name: "Operating Expenses", type: "expense", subtype: null },
  { code: "6200", name: "Travel & Entertainment", type: "expense", subtype: null },
];

/** Demo invoices (customer_id left null). */
export const DEMO_INVOICES: DemoInvoiceSeed[] = [
  {
    invoice_number: "INV-001",
    status: "draft",
    invoice_date: "2024-02-01",
    due_date: "2024-02-28",
    lines: [
      { description: "Consulting services", quantity: 10, unit_price: 150, discount: 0 },
      { description: "Setup fee", quantity: 1, unit_price: 500, discount: 0 },
    ],
  },
  {
    invoice_number: "INV-002",
    status: "sent",
    invoice_date: "2024-02-15",
    due_date: "2024-03-15",
    lines: [
      { description: "Monthly retainer", quantity: 1, unit_price: 2000, discount: 0 },
    ],
  },
  {
    invoice_number: "INV-003",
    status: "sent",
    invoice_date: "2024-03-01",
    due_date: "2024-03-31",
    lines: [
      { description: "License fee", quantity: 5, unit_price: 99, discount: 25 },
      { description: "Support pack", quantity: 1, unit_price: 199, discount: 0 },
    ],
  },
  {
    invoice_number: "INV-004",
    status: "paid",
    invoice_date: "2024-01-10",
    due_date: "2024-02-10",
    lines: [
      { description: "Project delivery", quantity: 1, unit_price: 3500, discount: 0 },
    ],
  },
];

/** Demo expense reports (employeeIndex refers to seeded employees order). */
export const DEMO_EXPENSE_REPORTS: DemoExpenseReportSeed[] = [
  {
    employeeIndex: 0,
    report_number: "EXP-001",
    status: "submitted",
    lines: [
      { description: "Client lunch", expense_date: "2024-02-05", amount: 85.5 },
      { description: "Taxi", expense_date: "2024-02-06", amount: 42 },
    ],
  },
  {
    employeeIndex: 2,
    report_number: "EXP-002",
    status: "draft",
    lines: [
      { description: "Office supplies", expense_date: "2024-02-12", amount: 120 },
    ],
  },
  {
    employeeIndex: 1,
    report_number: "EXP-003",
    status: "approved",
    lines: [
      { description: "Conference ticket", expense_date: "2024-02-01", amount: 299 },
      { description: "Hotel", expense_date: "2024-02-02", amount: 180 },
    ],
  },
];
