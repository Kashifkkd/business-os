# Employees Section – Detailed Plan & Hierarchy

This document outlines an **industry-standard** plan for the Employees (Staff) section in Business OS, including data model, hierarchy, subsections (Designation, Department, etc.), and how it fits the existing tenant-scoped architecture.

---

## 1. Overview & Goals

- **Section name**: Employees (UI can keep “Staff Roster” in sidebar for consistency).
- **Purpose**: Maintain a single source of truth for who works in the organization, their role (designation), department, and reporting line.
- **Scope**: Tenant-scoped; same pattern as Leads, Menu, Properties (RLS via `user_tenant_ids()`).
- **Hierarchy**: Organization → Departments → Designations → Employees with optional reporting (manager) and location.

---

## 2. Industry-Standard Hierarchy Concepts

| Concept | Description | Example |
|--------|-------------|--------|
| **Department** | Functional or business unit (cost center, team container). | Sales, Kitchen, Operations, HR, Finance |
| **Designation (Job Title)** | Role/position name; can be global or per-department. | Manager, Barista, Sales Associate, Agent |
| **Reporting line** | Who an employee reports to (manager). | Employee A → reports_to → Employee B |
| **Location (optional)** | Physical site/branch for multi-location tenants. | Downtown Cafe, Warehouse A |
| **Employee** | A person record linked to department, designation, and optional manager/location. | John Doe, Sales, Manager, reports to Jane |

Common patterns:

- **Flat list**: Just employees with department + designation (no reporting).
- **Org chart**: Employees + `reports_to` for tree visualization.
- **Department hierarchy**: Departments can have parent department (e.g. “Kitchen” → “Bakery”, “Grill”).
- **Designation level**: Optional seniority/level (e.g. Junior, Senior, Lead) for ordering and permissions.

---

## 3. Proposed Data Model

### 3.1 Tables (tenant-scoped, UUID primary keys)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   departments   │     │   designations   │     │   employees     │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id              │     │ id               │     │ id              │
│ tenant_id (FK)  │◄────│ tenant_id (FK)   │     │ tenant_id (FK)  │
│ name            │     │ name             │     │ profile_id (FK) │ nullable
│ code (optional) │     │ department_id    │     │ department_id   │──►departments
│ parent_id (FK)  │──┐  │ sort_order       │     │ designation_id  │──►designations
│ sort_order      │  │  │ level (optional) │     │ reports_to_id   │──►employees (self)
│ created_at      │  └──│ created_at       │     │ location_id     │──►locations (optional)
│ updated_at      │     │ updated_at       │     │ employee_number │
└─────────────────┘     └──────────────────┘     │ join_date       │
                                                  │ leave_date      │
                                                  │ is_active       │
                                                  │ metadata (JSONB)│
                                                  │ created_at      │
                                                  │ updated_at      │
                                                  └─────────────────┘
```

### 3.2 Departments

- **tenant_id**: Required; RLS by `user_tenant_ids()`.
- **name**: Unique per tenant (or per parent if using hierarchy).
- **code**: Optional short code (e.g. "SAL", "KIT") for imports/reports.
- **parent_id**: Optional self-FK for sub-departments (e.g. “Operations” → “Logistics”, “Warehouse”).
- **sort_order**: For stable UI ordering.
- **Indexes**: `(tenant_id)`, `(tenant_id, parent_id)`.

### 3.3 Designations

- **tenant_id**: Required.
- **name**: Job title (e.g. "Manager", "Barista", "Sales Associate").
- **department_id**: Optional; null = org-wide designation; set = department-specific.
- **sort_order** / **level**: Optional numeric level for seniority (e.g. 1=Junior, 2=Senior, 3=Lead).
- **Unique**: `(tenant_id, name)` or `(tenant_id, department_id, name)` if department-scoped.
- **Indexes**: `(tenant_id)`, `(department_id)`.

### 3.4 Employees

- **tenant_id**: Required.
- **profile_id**: Optional FK to `profiles` (auth user). Null for employees who don’t have system access (e.g. hourly workers).
- **department_id**: Required FK to `departments`.
- **designation_id**: Required FK to `designations`.
- **reports_to_id**: Optional FK to `employees` (self) for manager.
- **location_id**: Optional FK to `locations` if you add locations later.
- **employee_number**: Optional unique per tenant (e.g. EMP-001).
- **join_date** / **leave_date**: Optional dates; `leave_date` set = former employee.
- **is_active**: Boolean; default true; quick filter without parsing dates.
- **metadata**: JSONB for tenant-specific fields (pay grade, cost center, etc.).
- **Constraints**: Prevent circular `reports_to` (e.g. trigger or application logic).
- **Indexes**: `(tenant_id)`, `(tenant_id, department_id)`, `(tenant_id, is_active)`, `(reports_to_id)` for org chart.

### 3.5 Locations (optional, phase 2)

- **tenant_id**, **name**, **address**, **timezone**, **is_active**, **created_at**, **updated_at**.
- Employees get optional `location_id` for “where they work”.

---

## 4. Sub-Sections (UI & Routes)

Mirror the pattern used for **Settings** (sidebar + content) and **Menu/Properties** (module sub-nav). Staff is cross-industry, so use a **dedicated Staff layout** with its own sub-nav (like Settings), not industry-based `getModuleNavConfig`.

### 4.1 Route structure

| Route | Purpose |
|-------|--------|
| `/[orgId]/staff` | **Employees** – Roster list (table), filters by department/designation, search; “Add employee” → new/detail. |
| `/[orgId]/staff/[id]` | **Employee detail** – View/edit single employee; show department, designation, manager, location. |
| `/[orgId]/staff/new` | **New employee** – Form (profile link optional, department, designation, manager, dates, etc.). |
| `/[orgId]/staff/departments` | **Departments** – CRUD list; optional parent picker for hierarchy. |
| `/[orgId]/staff/designations` | **Designations** – CRUD list; optional department filter and level. |
| `/[orgId]/staff/org-chart` | **Org chart** – Read-only tree view by `reports_to` (optional phase 2). |

No “Teams” in MVP unless you explicitly need it; can be added later as a separate entity or tag.

### 4.2 Staff sub-nav (in Staff layout)

- **Employees** (roster) – default when opening Staff.
- **Departments**
- **Designations**
- **Org chart** (optional)

Implementation: `app/[orgId]/staff/layout.tsx` with a **StaffSidebar** (or reuse a generic SubSidebar with a `staffNav` config), same idea as `SettingsSidebar` and `settings-nav.ts`. Main content area renders `children` (list, detail, or subsection pages).

---

## 5. Hierarchy Maintenance Rules

1. **Department**
   - Create/update/delete only by tenant members (admin/owner or “HR” role if you add it).
   - If `parent_id` is used: prevent cycles (parent chain must not include self); optional constraint or trigger.
   - When deleting a department: either restrict if employees exist, or reassign employees to another department (soft or hard).

2. **Designation**
   - Same permission idea as departments.
   - If `designation.department_id` is set, only show/use that designation for employees in that department (or in child departments if you have hierarchy).
   - When deleting: restrict if any employee uses it, or reassign.

3. **Employee**
   - **reports_to_id**: Must be same tenant; ideally same or ancestor department (optional business rule). Prevent cycles (no A → B → A); enforce in app or DB trigger.
   - **department_id** / **designation_id**: Required; validate that designation can be used for that department (if designation is department-scoped).
   - **profile_id**: If present, consider one active employee record per profile per tenant (unless you support multiple roles).

4. **Deactivation**
   - Prefer **leave_date** + **is_active = false** over hard delete for history and reporting.
   - Exclude inactive employees from default roster views; optional “Include former” filter.

---

## 6. Implementation Phases

### Phase 1 – Core (MVP)

- Migration: `departments`, `designations`, `employees` (without `location_id` and without department hierarchy if you want to keep MVP simple).
- RLS on all three tables using `tenant_id IN (SELECT user_tenant_ids())`.
- Types in `lib/supabase/types.ts` (Department, Designation, Employee).
- Queries in `lib/supabase/queries.ts` (list by tenant, get by id, create, update; list designations by department; list employees with department/designation/reports_to names).
- Staff layout + Staff sub-nav (Employees, Departments, Designations).
- Pages: Staff roster (table + filters), Employee detail/edit, New employee, Departments CRUD, Designations CRUD.
- Forms: Department form; Designation form (with optional department); Employee form (profile optional, department, designation, reports_to, join_date, employee_number, is_active).

### Phase 2 – Enhancements

- **Org chart** page: tree by `reports_to_id` (e.g. recursive CTE or app-side tree build).
- **Department hierarchy**: `parent_id` on departments, UI for tree and validation.
- **Locations**: `locations` table, `location_id` on employees, filter roster by location.
- **Validation**: Circular report check in DB (trigger or constraint) or in app on save.
- **Soft delete / leave_date**: “Former employees” filter and reporting.

### Phase 3 – Optional

- **Teams**: Separate table or tags for project/cross-department teams.
- **Designation levels**: Use `level` in designations for sorting and access rules.
- **Import/export**: CSV for employees/departments/designations.
- **Sync with tenant_members**: When `profile_id` is set, optionally show “Has access” and link to Settings → Members.

---

## 7. Alignment With Existing Codebase

- **Tenant**: All new tables use `tenant_id` and RLS with `user_tenant_ids()` (same as leads, menu_categories, properties).
- **Naming**: “Staff” in sidebar and URL (`/staff`) is fine; internal types can be `Employee`, `Department`, `Designation`.
- **Patterns**: Server components and server data fetch where possible; client for tables, forms, and filters. Use `@/components/ui` (shadcn-style) and Tailwind.
- **Navigation**: Staff layout with its own sidebar (like Settings), not `getModuleNavConfig` (which is industry-specific). Optionally later add a “Staff” pathPrefix and a shared SubSidebar config for cross-industry modules if you want one pattern for all.
- **Types**: Add to `lib/supabase/types.ts`; keep API/component props explicit. Use shared types for DB entities.

---

## 8. File Checklist (Phase 1)

- `supabase/migrations/YYYYMMDD_employees_departments_designations.sql` – tables, indexes, RLS, triggers.
- `lib/supabase/types.ts` – Department, Designation, Employee (and optional Location for phase 2).
- `lib/supabase/queries.ts` – CRUD and list functions for departments, designations, employees.
- `app/[orgId]/staff/layout.tsx` – layout with Staff sidebar.
- `app/[orgId]/staff/page.tsx` – roster (replace placeholder).
- `app/[orgId]/staff/employees-table.tsx` (or inline table in page) – table + filters.
- `app/[orgId]/staff/[id]/page.tsx` – employee detail/edit.
- `app/[orgId]/staff/new/page.tsx` – new employee form.
- `app/[orgId]/staff/departments/page.tsx` – departments list + CRUD.
- `app/[orgId]/staff/designations/page.tsx` – designations list + CRUD.
- Optional: `lib/navigation/staff-nav.ts` – nav items for Staff (Employees, Departments, Designations).
- Hooks: e.g. `use-employees.ts`, `use-departments.ts`, `use-designations.ts` if you follow the leads/hooks pattern.

---

## 9. Summary

- **Hierarchy**: Organization (tenant) → **Departments** (optional parent) → **Designations** (optional department link) → **Employees** (department, designation, optional reports_to and location).
- **Sub-sections**: Employees (roster + detail + new), Departments, Designations, and optionally Org chart.
- **Maintenance**: Tenant-scoped RLS; no circular reports_to; optional department-scoped designations; soft leave via leave_date/is_active; clear rules for delete/reassign of departments and designations.
- **Industry standard**: Matches common HR structure (departments, job titles, reporting line) and fits your existing multi-tenant, server-first, UI component patterns.

This plan is ready to be broken into implementation tasks (migration first, then types/queries, then layout and pages).
