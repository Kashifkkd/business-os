# Business OS – Detailed Testing Scenarios

This document defines testing scenarios for the entire project. Use it as a roadmap for unit tests (Vitest), component tests (React Testing Library), and E2E tests (Playwright).

---

## 1. Shared / Lib

### 1.1 Format (`lib/format.ts`)

| Scenario | Type | Description |
|----------|------|-------------|
| formatPrice: null/undefined returns "—" | Unit | `formatPrice(null)`, `formatPrice(undefined)` → `"—"` |
| formatPrice: number formats as USD | Unit | `formatPrice(99.5)` → `"$99.50"`, two decimal places |
| truncate: empty/null returns "—" | Unit | `truncate("", 10)`, `truncate(null, 10)` → `"—"` |
| truncate: short string unchanged | Unit | `truncate("Hi", 10)` → `"Hi"` |
| truncate: long string ellipsized | Unit | `truncate("Hello world", 5)` → `"Hello…"` |
| formatDate: invalid/empty returns "—" | Unit | Invalid date or null → `"—"` |
| formatDate: valid date formatted | Unit | Known date string → locale date (e.g. Jan 15, 2025) |
| formatTime / formatDateTime | Unit | Same null/valid behavior as formatDate |
| formatTimeAgo: just now / min / hr / day | Unit | Past timestamps → "just now", "5 min ago", "2 hr ago", "3 days ago" |

### 1.2 API Response (`lib/api-response.ts`)

| Scenario | Type | Description |
|----------|------|-------------|
| apiSuccess: returns success true and data | Unit | `apiSuccess({ id: 1 })` → `{ success: true, data: { id: 1 } }` |
| apiSuccess: optional total for lists | Unit | `apiSuccess(items, 42)` includes `total: 42` |
| apiError: returns success false and error | Unit | `apiError("NOT_FOUND", "msg")` → `{ success: false, error: { code, message } }` |
| statusToErrorCode: maps 400/401/404/409/422 | Unit | 400 → BAD_REQUEST, 401 → UNAUTHORIZED, etc. |
| getDataOrThrow: success returns data | Unit | `getDataOrThrow({ success: true, data: x })` → `x` |
| getDataOrThrow: error throws with message and code | Unit | Throws Error with message and code |
| isApiSuccess: type guard | Unit | True only for `success: true` response |

### 1.3 Get Initials (`lib/get-initials.ts`)

| Scenario | Type | Description |
|----------|------|-------------|
| Full name → first + last initial | Unit | "John Doe" → "JD" |
| Single name → first two chars | Unit | "John" → "JO" |
| Fallback overrides name | Unit | `getInitials("", "AB")` → "AB" |
| Empty no fallback → "—" | Unit | `getInitials("")` → "—" |

### 1.4 Task Priority (`lib/task-priority.ts`)

| Scenario | Type | Description |
|----------|------|-------------|
| getPriorityLabel returns label for each priority | Unit | "high" → "High", "urgent" → "Urgent" |
| getPriorityClassName returns non-empty string | Unit | Each priority has a class string |

### 1.5 Lead Sources (`lib/lead-sources.ts`)

| Scenario | Type | Description |
|----------|------|-------------|
| normalizeSourceColor: adds # if missing | Unit | `"abc"` → `"#abc"`, with length cap |
| normalizeSourceColor: undefined → default | Unit | Returns DEFAULT_SOURCE_COLOR |
| sourceColorMap: builds name → color map | Unit | From LeadSourceItem[]; uses normalizeSourceColor |

### 1.6 Utils (`lib/utils.ts`)

| Scenario | Type | Description |
|----------|------|-------------|
| cn: merges class names | Unit | `cn("a", "b")` → merged string; conditional classes applied |

### 1.7 Is Array With Values (`lib/is-array-with-values.ts`)

| Scenario | Type | Description |
|----------|------|-------------|
| Empty array / null / undefined → false | Unit | Type guard excludes empty |
| Non-empty array → true | Unit | Type guard narrows to T[] |

### 1.8 Property Schema / API (`lib/property-schema.ts`, `lib/property-api.ts`)

| Scenario | Type | Description |
|----------|------|-------------|
| propertyFormSchema: valid payload passes | Unit | Zod parse with required fields |
| propertyFormSchema: missing required fails | Unit | Invalid/missing fields throw or return error |
| propertyFormValuesToPayload / propertyToFormValues | Unit | Round-trip or single-direction mapping |

### 1.9 Navigation (`lib/navigation/module-nav.ts`)

| Scenario | Type | Description |
|----------|------|-------------|
| getLeadsModuleNav: returns config with pathPrefixes and items | Unit | Paths under leads |
| getTasksModuleNav: same for tasks | Unit | List, board, calendar, table |
| getModuleNavConfigForPath: path under /leads → Leads nav | Unit | Industry + basePath + pathname |
| getModuleNavConfig: cafe → Cafe nav, real_estate → Real Estate | Unit | Industry-based config |

---

## 2. Auth

### 2.1 Login (`app/(auth)/login/page.tsx`)

| Scenario | Type | Description |
|----------|------|-------------|
| Login page renders "Sign in" heading | E2E | Visible heading |
| Login form has email and password inputs | E2E | getByRole for textbox, password |
| Invalid credentials show error message | E2E | Submit bad creds, assert role="alert" or error text |
| Redirect after login (next param) | E2E | Optional: sign in, expect redirect to next or /dashboard |

### 2.2 Signup (`app/(auth)/signup/page.tsx`)

| Scenario | Type | Description |
|----------|------|-------------|
| Signup page loads and shows form | E2E | Heading and form visible |
| Link to login exists | E2E | Navigation to login |

### 2.3 Dashboard / Protected Routes

| Scenario | Type | Description |
|----------|------|-------------|
| Unauthenticated user redirected to login | E2E | Visit /dashboard → redirect to /login |
| Authenticated user sees dashboard | E2E | After login, /dashboard loads (org list or redirect) |

---

## 3. Org Shell & Navigation

| Scenario | Type | Description |
|----------|------|-------------|
| Home (/) shows "Business OS" and login/dashboard links | E2E | Already in smoke |
| After login, org home or dashboard loads | E2E | Navigate to /{orgId} or /dashboard |
| Sub-nav reflects current module (Leads, Tasks, etc.) | E2E | When under /orgId/leads, leads sub-nav active |
| Settings accessible from org context | E2E | Navigate to /orgId/settings |

---

## 4. Staff Module

### 4.1 Departments

| Scenario | Type | Description |
|----------|------|-------------|
| Departments list page loads | E2E | GET /api/orgs/[orgId]/departments used by page |
| Create department: form submit creates record | E2E | Fill form, submit, list shows new department |
| Edit department: update name/code | E2E | Open edit, change, save |
| API: GET without orgId → 400 | Unit/API | Missing orgId returns BAD_REQUEST |
| API: GET with invalid orgId → 404 | Unit/API | Org not found |
| API: GET unauthenticated → 401 | Unit/API | No user → UNAUTHORIZED |
| API: POST valid body → 201 and data | Unit/API | Created department returned |

### 4.2 Designations

| Scenario | Type | Description |
|----------|------|-------------|
| Designations list and create/edit flows | E2E | Same pattern as departments |
| API: GET/POST/PATCH/DELETE with auth and orgId | Unit/API | Same pattern as departments route |

### 4.3 Employees / Staff List

| Scenario | Type | Description |
|----------|------|-------------|
| Staff list page loads with table | E2E | Pagination, search if present |
| New staff form: required fields validated | E2E | Client and/or API validation |

---

## 5. Leads Module

| Scenario | Type | Description |
|----------|------|-------------|
| Leads list loads with search/filters | E2E | URL state for search, filters |
| Create lead: form validation and submit | E2E | Required fields, success redirect |
| Lead detail page shows activities | E2E | Open lead, activities section |
| Pipeline view shows stages | E2E | Leads grouped by stage |
| Sources page: CRUD for lead sources | E2E | Create/edit source, color picker |
| API: GET leads with page, pageSize, search | Unit/API | Paginated list, total |
| API: POST lead with valid payload | Unit/API | 201 and data |
| API: PATCH lead status/stage | Unit/API | Update single lead |

---

## 6. Tasks Module

| Scenario | Type | Description |
|----------|------|-------------|
| Task list/board/calendar/table views load | E2E | All four views render without error |
| Create task: required fields, priority, assignee | E2E | Form submit creates task |
| Edit task: update title, due date, priority | E2E | Save updates |
| Task detail: comments and activities | E2E | Add comment, see in list |
| API: GET tasks with filters (space, list, status) | Unit/API | Filtering and pagination |
| API: POST/PATCH/DELETE task | Unit/API | Auth and org scope |

---

## 7. Menu Module (Cafe)

| Scenario | Type | Description |
|----------|------|-------------|
| Menu items list with categories | E2E | List and category filter |
| Create menu item: form and validation | E2E | Required fields, price |
| Menu categories and subcategories CRUD | E2E | Categories list, new/edit |
| API: GET menu-items, menu-categories | Unit/API | List endpoints |
| API: POST menu item with category | Unit/API | 201 and data |

---

## 8. Properties & Listings (Real Estate)

| Scenario | Type | Description |
|----------|------|-------------|
| Properties list and filters | E2E | List loads, optional filters |
| Create property: form and image upload | E2E | Required fields, images |
| Property detail: edit and images | E2E | Edit form, image list |
| Listings list and create listing | E2E | Listing linked to property |
| API: GET/POST/PATCH properties | Unit/API | Scoped by orgId |
| API: GET/POST listings | Unit/API | Same |

---

## 9. Inventory Module

| Scenario | Type | Description |
|----------|------|-------------|
| Inventory dashboard loads | E2E | Summary or widgets |
| Items list: search, pagination | E2E | Table with pagination |
| Warehouses, vendors, item groups CRUD | E2E | List and new/edit pages |
| Purchase orders: list and create | E2E | PO form and list |
| Sales orders: list and create | E2E | SO form and list |
| Bills, picklists, packages | E2E | List and detail pages |
| API: GET items, warehouses, vendors with pagination | Unit/API | Consistent list shape |
| API: POST/PATCH stock adjustment | Unit/API | Items stock route |

---

## 10. Finance Module

| Scenario | Type | Description |
|----------|------|-------------|
| Chart of accounts list and create account | E2E | COA list, new account form |
| Invoices list and create invoice | E2E | Invoice form and list |
| Bills list and create bill | E2E | Bill form and list |
| Banking: accounts and transactions | E2E | Account detail, transaction list |
| Reports: P&L, balance sheet, cash flow, trial balance | E2E | Report pages load without error |
| API: GET accounts, invoices, bills | Unit/API | Scoped by orgId |
| API: POST journal entry or invoice | Unit/API | Validation and 201 |

---

## 11. Sales Module

| Scenario | Type | Description |
|----------|------|-------------|
| Deals list and pipeline view | E2E | Deals table, pipeline stages |
| Create deal: form and link to lead | E2E | Optional convert lead |
| Deal detail: activities and stages | E2E | Update stage, add activity |
| API: GET deals, pipeline-stages | Unit/API | List and config |
| API: POST convert-lead | Unit/API | Creates deal from lead |

---

## 12. Marketing Module

| Scenario | Type | Description |
|----------|------|-------------|
| Segments list and create segment | E2E | Segment form |
| Campaigns list and create campaign | E2E | Campaign form |
| Templates and journeys list | E2E | Pages load |
| Analytics page loads | E2E | No crash |
| API: GET segments, campaigns, templates | Unit/API | List endpoints |

---

## 13. Settings

| Scenario | Type | Description |
|----------|------|-------------|
| Settings general page loads | E2E | Form or sections |
| Members list and roles | E2E | Members table |
| Billing, branding, localization, integrations | E2E | Each settings sub-page loads |
| API: GET/PATCH org or members | Unit/API | Scoped by orgId |

---

## 14. E2E Critical Paths (Playwright)

| Scenario | File / Describe | Description |
|----------|------------------|-------------|
| Smoke: home and login | [e2e/smoke.spec.ts](../e2e/smoke.spec.ts) | Home "Business OS", login heading |
| Auth: login/signup forms and links | [e2e/auth.spec.ts](../e2e/auth.spec.ts) | Email/password inputs, link to signup/signin, invalid login error |
| Auth: protected routes | [e2e/auth.spec.ts](../e2e/auth.spec.ts) | Dashboard redirects to /login when unauthenticated |
| Navigation: home → login → signup | [e2e/navigation.spec.ts](../e2e/navigation.spec.ts) | Link navigation between public pages |
| Navigation: org routes require auth | [e2e/navigation.spec.ts](../e2e/navigation.spec.ts) | Visiting /{orgId} or /{orgId}/leads without auth redirects to /login (orgId must be UUID format) |
| Optional: authenticated flow with storageState | e2e/fixtures or global setup | Login once, reuse for org routes |

---

## 15. Test Data & Fixtures

- **Unit/API**: Use mocks for Supabase (e.g. `createClient` mock) or test DB; no real auth in unit tests.
- **E2E**: Use a dedicated test org and test user; seed via demo/load or migrations; use `storageState` for authenticated E2E to avoid logging in every test.

---

## 16. Running Tests

| Command | Purpose |
|---------|---------|
| `npm run test` | Vitest watch (unit + component) |
| `npm run test:run` | Vitest single run (CI) |
| `npm run test:e2e` | Playwright E2E (starts dev server if not running) |
| `npm run test:e2e:ui` | Playwright UI mode |

CI: run `npx playwright install --with-deps` (or `install-deps`) on the runner for browser binaries.
