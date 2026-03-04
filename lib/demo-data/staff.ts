export type DemoDepartmentSeed = {
  name: string;
  code: string | null;
  sort_order: number;
};

export type DemoDesignationSeed = {
  departmentIndex: number;
  name: string;
  sort_order: number;
};

export type DemoEmployeeSeed = {
  departmentIndex: number;
  designationIndex: number;
  employee_number: string;
  join_date: string | null;
  is_active: boolean;
};

export const DEMO_DEPARTMENTS: DemoDepartmentSeed[] = [
  { name: "Sales", code: "SAL", sort_order: 0 },
  { name: "Marketing", code: "MKT", sort_order: 1 },
  { name: "Operations", code: "OPS", sort_order: 2 },
  { name: "Finance", code: "FIN", sort_order: 3 },
  { name: "HR", code: "HR", sort_order: 4 },
];

export const DEMO_DESIGNATIONS: DemoDesignationSeed[] = [
  { departmentIndex: 0, name: "Sales Manager", sort_order: 0 },
  { departmentIndex: 0, name: "Sales Rep", sort_order: 1 },
  { departmentIndex: 0, name: "SDR", sort_order: 2 },
  { departmentIndex: 1, name: "Marketing Manager", sort_order: 0 },
  { departmentIndex: 1, name: "Content Specialist", sort_order: 1 },
  { departmentIndex: 2, name: "Operations Manager", sort_order: 0 },
  { departmentIndex: 2, name: "Coordinator", sort_order: 1 },
  { departmentIndex: 3, name: "Finance Manager", sort_order: 0 },
  { departmentIndex: 3, name: "Accountant", sort_order: 1 },
  { departmentIndex: 4, name: "HR Manager", sort_order: 0 },
  { departmentIndex: 4, name: "HR Associate", sort_order: 1 },
];

export const DEMO_EMPLOYEES: DemoEmployeeSeed[] = [
  { departmentIndex: 0, designationIndex: 0, employee_number: "EMP-001", join_date: "2023-01-15", is_active: true },
  { departmentIndex: 0, designationIndex: 1, employee_number: "EMP-002", join_date: "2023-03-01", is_active: true },
  { departmentIndex: 0, designationIndex: 1, employee_number: "EMP-003", join_date: "2024-01-10", is_active: true },
  { departmentIndex: 1, designationIndex: 3, employee_number: "EMP-004", join_date: "2023-06-01", is_active: true },
  { departmentIndex: 1, designationIndex: 4, employee_number: "EMP-005", join_date: "2024-02-01", is_active: true },
  { departmentIndex: 2, designationIndex: 5, employee_number: "EMP-006", join_date: "2023-02-15", is_active: true },
  { departmentIndex: 3, designationIndex: 8, employee_number: "EMP-007", join_date: "2023-04-01", is_active: true },
  { departmentIndex: 4, designationIndex: 10, employee_number: "EMP-008", join_date: "2024-01-20", is_active: true },
];
