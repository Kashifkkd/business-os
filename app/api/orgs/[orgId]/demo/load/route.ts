import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import { getDemoLeadsForIndustry, DEMO_LEAD_SOURCES_EXTRA } from "@/lib/demo-data/leads";
import {
  DEMO_PROPERTY_CATEGORIES,
  DEMO_PROPERTY_SUBCATEGORIES,
  DEMO_PROPERTIES,
  DEMO_LISTINGS,
} from "@/lib/demo-data/real-estate";
import {
  DEMO_TASK_LABELS,
  DEMO_TASK_SPACES,
  DEMO_TASK_LISTS,
  DEMO_TASKS,
} from "@/lib/demo-data/tasks";
import {
  DEMO_MARKETING_SEGMENTS,
  DEMO_MARKETING_TEMPLATES,
  DEMO_MARKETING_CAMPAIGNS,
  DEMO_MARKETING_JOURNEYS,
} from "@/lib/demo-data/marketing";
import {
  getDemoProductsForIndustry,
  getDemoDealsForIndustry,
  DEMO_DEAL_ACTIVITIES,
} from "@/lib/demo-data/sales";
import {
  DEMO_DEPARTMENTS,
  DEMO_DESIGNATIONS,
  DEMO_EMPLOYEES,
} from "@/lib/demo-data/staff";
import {
  DEMO_INVENTORY_GROUPS,
  DEMO_INVENTORY_ITEMS,
  DEMO_WAREHOUSES,
  DEMO_VENDORS,
  DEMO_STOCK_LEVELS,
  DEMO_PURCHASE_ORDERS,
  DEMO_VENDOR_BILLS,
  DEMO_SALES_ORDERS,
  DEMO_PICKLISTS,
  DEMO_PACKAGES,
  DEMO_COMPOSITE_ITEMS,
} from "@/lib/demo-data/inventory";
import {
  DEMO_MENU_CATEGORIES,
  DEMO_MENU_SUBCATEGORIES,
  DEMO_MENU_ITEMS,
  DEMO_MENU_DISCOUNTS,
} from "@/lib/demo-data/menu";
import {
  DEMO_ACCOUNTS,
  DEMO_INVOICES,
  DEMO_EXPENSE_REPORTS,
} from "@/lib/demo-data/finance";

type RouteParams = { orgId: string };

/** Avoid returning HTML or huge strings to the client (e.g. Cloudflare 525 page). */
function sanitizeErrorMessage(raw: string, fallback: string): string {
  const s = (raw ?? "").trim();
  if (s.length > 400 || /<\s*\!?DOCTYPE|<\s*html/i.test(s)) return fallback;
  return s || fallback;
}

async function ensureOrgDefaultStatuses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string
): Promise<string[]> {
  const { data: existing } = await supabase
    .from("task_statuses")
    .select("id")
    .eq("tenant_id", tenantId)
    .is("space_id", null)
    .limit(3);
  if (existing && existing.length >= 3) {
    return existing.map((r) => r.id as string);
  }
  const defaults = [
    { name: "To Do", type: "todo", sort_order: 0, color: "#94a3b8" },
    { name: "In Progress", type: "in_progress", sort_order: 1, color: "#3b82f6" },
    { name: "Done", type: "done", sort_order: 2, color: "#22c55e" },
  ];
  const { data: inserted } = await supabase
    .from("task_statuses")
    .insert(
      defaults.map((d) => ({
        tenant_id: tenantId,
        space_id: null,
        name: d.name,
        type: d.type,
        sort_order: d.sort_order,
        color: d.color,
      }))
    )
    .select("id");
  return (inserted ?? []).map((r) => r.id as string);
}

async function ensureSalesPipelineStages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string
): Promise<string[]> {
  const { data: existing } = await supabase
    .from("sales_pipeline_stages")
    .select("id")
    .eq("tenant_id", tenantId)
    .order("sort_order")
    .limit(5);
  if (existing && existing.length > 0) {
    return existing.map((r) => r.id as string);
  }
  const defaults = [
    { name: "Qualification", sort_order: 0, is_won: false, is_lost: false },
    { name: "Proposal", sort_order: 1, is_won: false, is_lost: false },
    { name: "Negotiation", sort_order: 2, is_won: false, is_lost: false },
    { name: "Closed Won", sort_order: 3, is_won: true, is_lost: false },
    { name: "Closed Lost", sort_order: 4, is_won: false, is_lost: true },
  ];
  const { data: inserted } = await supabase
    .from("sales_pipeline_stages")
    .insert(
      defaults.map((s) => ({
        tenant_id: tenantId,
        name: s.name,
        sort_order: s.sort_order,
        is_won: s.is_won,
        is_lost: s.is_lost,
      }))
    )
    .select("id");
  return (inserted ?? []).map((r) => r.id as string);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId"), {
      status: 400,
    });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Org not found"), {
      status: 404,
    });
  }

  if (tenant.role !== "owner" && tenant.role !== "admin") {
    return NextResponse.json(
      apiError(API_ERROR_CODES.FORBIDDEN, "Only owners and admins can load demo data"),
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), {
      status: 401,
    });
  }

  const summary: Record<string, number> = {};

  // Real estate: categories, sub-categories, properties + listings ----------
  if (tenant.industry === "real_estate") {
    const { count } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);

    if ((count ?? 0) === 0) {
      // Seed categories + sub-categories if none exist yet
      const { data: existingCategories } = await supabase
        .from("property_categories")
        .select("id")
        .eq("tenant_id", orgId)
        .limit(1);
      if (!existingCategories || existingCategories.length === 0) {
        const { data: insertedCategories, error: categoriesError } = await supabase
          .from("property_categories")
          .insert(
            DEMO_PROPERTY_CATEGORIES.map((c) => ({
              tenant_id: orgId,
              name: c.name,
              sort_order: c.sort_order,
            }))
          )
          .select("id, name");
        if (categoriesError || !insertedCategories) {
          return NextResponse.json(
            apiError(
              API_ERROR_CODES.BAD_REQUEST,
              sanitizeErrorMessage(categoriesError?.message ?? "", "Failed to seed property categories.")
            ),
            { status: 400 }
          );
        }

        const catMap = new Map<string, string>(
          insertedCategories.map((c: { id: string; name: string }) => [c.name, c.id])
        );

        const { error: subError } = await supabase.from("property_sub_categories").insert(
          DEMO_PROPERTY_SUBCATEGORIES.map((sc) => ({
            tenant_id: orgId,
            name: sc.name,
            sort_order: sc.sort_order,
            category_id: catMap.get(sc.categoryName) ?? null,
          }))
        );
        if (subError) {
          return NextResponse.json(
            apiError(
              API_ERROR_CODES.BAD_REQUEST,
              sanitizeErrorMessage(subError.message, "Failed to seed property sub-categories.")
            ),
            { status: 400 }
          );
        }
      }

      // Properties
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .insert(
          DEMO_PROPERTIES.map((p) => ({
            tenant_id: orgId,
            ...p,
          }))
        )
        .select("id, address");

      if (propertiesError || !properties) {
        return NextResponse.json(
          apiError(
            API_ERROR_CODES.BAD_REQUEST,
            sanitizeErrorMessage(propertiesError?.message ?? "", "Failed to seed properties.")
          ),
          { status: 400 }
        );
      }

      summary.properties = properties.length;

      const { error: listingsError } = await supabase.from("listings").insert(
        DEMO_LISTINGS.map((l) => ({
          tenant_id: orgId,
          property_id: properties[l.propertyIndex]?.id ?? null,
          status: l.status,
          title: l.title,
          price: l.price,
          description: l.description,
        }))
      );

      if (listingsError) {
        return NextResponse.json(
          apiError(
            API_ERROR_CODES.BAD_REQUEST,
            sanitizeErrorMessage(listingsError.message, "Failed to seed listings.")
          ),
          { status: 400 }
        );
      }

      summary.listings = DEMO_LISTINGS.length;
    }
  }

  // Leads --------------------------------------------------------------------
  {
    const demoLeads = getDemoLeadsForIndustry(tenant.industry);
    const { count } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);
    if ((count ?? 0) < demoLeads.length) {
      const { error } = await supabase.from("leads").insert(
        demoLeads.map((lead) => ({
          tenant_id: orgId,
          ...lead,
        }))
      );
      if (error) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(error.message, "Failed to seed leads.")),
          { status: 400 }
        );
      }
      summary.leads = demoLeads.length;
    }
  }

  // Tasks: multiple spaces, lists per space, labels, tasks ------------------
  {
    const { count } = await supabase
      .from("task_spaces")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);
    if ((count ?? 0) === 0) {
      const statusIds = await ensureOrgDefaultStatuses(supabase, orgId);

      const { data: spaces, error: spacesError } = await supabase
        .from("task_spaces")
        .insert(
          DEMO_TASK_SPACES.map((s, i) => ({
            tenant_id: orgId,
            name: s.name,
            description: s.description,
            sort_order: s.sort_order ?? i,
          }))
        )
        .select("id");
      if (spacesError || !spaces?.length) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, "Failed to create demo task spaces"),
          { status: 400 }
        );
      }

      const listIdsBySpaceAndList: Map<string, string> = new Map();
      for (let i = 0; i < spaces.length; i++) {
        const spaceId = spaces[i].id;
        const listsForSpace = DEMO_TASK_LISTS.filter((l) => l.spaceIndex === i);
        const { data: lists, error: listErr } = await supabase
          .from("task_lists")
          .insert(listsForSpace.map((l, j) => ({ space_id: spaceId, name: l.name, sort_order: l.sort_order ?? j })))
          .select("id");
        if (listErr || !lists?.length) {
          return NextResponse.json(
            apiError(API_ERROR_CODES.BAD_REQUEST, "Failed to create demo task lists"),
            { status: 400 }
          );
        }
        listsForSpace.forEach((_, listIdx) => {
          listIdsBySpaceAndList.set(`${i}-${listIdx}`, lists[listIdx]?.id ?? "");
        });
      }

      const firstSpaceId = spaces[0]?.id;
      if (firstSpaceId) {
        const { data: existingLabels } = await supabase
          .from("task_labels")
          .select("id")
          .eq("tenant_id", orgId)
          .eq("space_id", firstSpaceId)
          .limit(1);
        if (!existingLabels || existingLabels.length === 0) {
          await supabase.from("task_labels").insert(
            DEMO_TASK_LABELS.map((lbl) => ({
              tenant_id: orgId,
              space_id: firstSpaceId,
              name: lbl.name,
              color: lbl.color,
              sort_order: lbl.sort_order,
            }))
          );
        }
      }

      const taskRows = DEMO_TASKS.map((t, index) => {
        const listId = listIdsBySpaceAndList.get(`${t.spaceIndex}-${t.listIndex}`);
        const statusId = statusIds[t.statusIndex ?? 0] ?? statusIds[0];
        const spaceId = spaces[t.spaceIndex]?.id;
        if (!listId || !spaceId) return null;
        return {
          tenant_id: orgId,
          space_id: spaceId,
          list_id: listId,
          status_id: statusId,
          title: t.title,
          description: t.description,
          priority: t.priority,
          sort_order: index,
        };
      }).filter(Boolean) as Array<{
        tenant_id: string;
        space_id: string;
        list_id: string;
        status_id: string;
        title: string;
        description: string | null;
        priority: string;
        sort_order: number;
      }>;

      const { error: tasksError } = await supabase.from("tasks").insert(taskRows);
      if (tasksError) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, "Failed to create demo tasks"),
          { status: 400 }
        );
      }
      summary.tasks = taskRows.length;
    }
  }

  // Sales: pipeline stages, products, deals, deal activities -----------------
  {
    const stageIds = await ensureSalesPipelineStages(supabase, orgId);

    const { count: dealsCount } = await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);

    if ((dealsCount ?? 0) === 0 && stageIds.length > 0) {
      const { data: leadRows } = await supabase
        .from("leads")
        .select("id")
        .eq("tenant_id", orgId)
        .order("created_at", { ascending: true });
      const leadIds = (leadRows ?? []).map((r) => r.id as string);

      const products = getDemoProductsForIndustry(tenant.industry);
      const { error: productsError } = await supabase.from("products").insert(
        products.map((p) => ({
          tenant_id: orgId,
          name: p.name,
          description: p.description,
          unit_price: p.unit_price,
          currency: p.currency,
          is_active: true,
        }))
      );
      if (productsError) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(productsError.message, "Failed to seed products.")),
          { status: 400 }
        );
      }

      const demoDeals = getDemoDealsForIndustry(tenant.industry);
      const dealRows = demoDeals.map((d) => ({
        tenant_id: orgId,
        name: d.name,
        stage_id: stageIds[d.stageIndex] ?? stageIds[0],
        value: d.value,
        probability: d.probability,
        lead_id: d.leadIndex != null && leadIds[d.leadIndex] ? leadIds[d.leadIndex] : null,
      }));
      const { data: insertedDeals, error: dealsError } = await supabase
        .from("deals")
        .insert(dealRows)
        .select("id");
      if (dealsError) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(dealsError.message, "Failed to seed deals.")),
          { status: 400 }
        );
      }
      summary.deals = insertedDeals?.length ?? 0;

      const activityRows = DEMO_DEAL_ACTIVITIES.filter((a) => (insertedDeals?.length ?? 0) > a.dealIndex).map((a) => ({
        tenant_id: orgId,
        deal_id: insertedDeals![a.dealIndex]!.id,
        type: a.type,
        content: a.content,
      }));
      if (activityRows.length > 0) {
        const { error: actError } = await supabase.from("deal_activities").insert(activityRows);
        if (actError) {
          return NextResponse.json(
            apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(actError.message, "Failed to seed deal activities.")),
            { status: 400 }
          );
        }
      }
    }
  }

  // Marketing: segments, templates, campaigns, journeys ----------------------
  {
    const { count } = await supabase
      .from("marketing_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);

    if ((count ?? 0) === 0) {
      const { data: segments, error: segmentsError } = await supabase
        .from("marketing_segments")
        .insert(
          DEMO_MARKETING_SEGMENTS.map((s) => ({
            tenant_id: orgId,
            name: s.name,
            description: s.description,
            definition: s.definition,
            estimated_count: null,
          }))
        )
        .select("id");
      if (segmentsError || !segments?.length) {
        return NextResponse.json(
          apiError(
            API_ERROR_CODES.BAD_REQUEST,
            sanitizeErrorMessage(segmentsError?.message ?? "", "Failed to create demo marketing segments.")
          ),
          { status: 400 }
        );
      }

      const { data: templates, error: templatesError } = await supabase
        .from("marketing_templates")
        .insert(
          DEMO_MARKETING_TEMPLATES.map((t) => ({
            tenant_id: orgId,
            name: t.name,
            description: t.description,
            channel: t.channel,
            subject: t.subject,
            body: t.body,
            variables: t.variables,
            is_active: true,
          }))
        )
        .select("id");
      if (templatesError || !templates?.length) {
        return NextResponse.json(
          apiError(
            API_ERROR_CODES.BAD_REQUEST,
            sanitizeErrorMessage(templatesError?.message ?? "", "Failed to create demo marketing templates.")
          ),
          { status: 400 }
        );
      }

      const campaignRows = DEMO_MARKETING_CAMPAIGNS.map((c) => ({
        tenant_id: orgId,
        name: c.name,
        description: c.description,
        objective: c.objective,
        status: c.status,
        primary_channel: c.primary_channel,
        primary_segment_id: segments[c.segmentIndex]?.id ?? null,
        tags: c.tags,
        metadata: {},
      }));
      const { error: campaignsError } = await supabase.from("marketing_campaigns").insert(campaignRows);
      if (campaignsError) {
        return NextResponse.json(
          apiError(
            API_ERROR_CODES.BAD_REQUEST,
            sanitizeErrorMessage(campaignsError.message, "Failed to create demo marketing campaigns.")
          ),
          { status: 400 }
        );
      }

      const journeyRows = DEMO_MARKETING_JOURNEYS.map((j) => ({
        tenant_id: orgId,
        name: j.name,
        description: j.description,
        status: j.status,
        trigger_type: j.trigger_type,
        trigger_config: j.trigger_config,
        steps: j.steps.map((step) => ({
          type: step.type,
          template_id: templates[step.templateIndex]?.id ?? null,
          delay_minutes: step.delay_minutes ?? 0,
        })),
      }));
      const { error: journeysError } = await supabase.from("marketing_journeys").insert(journeyRows);
      if (journeysError) {
        return NextResponse.json(
          apiError(
            API_ERROR_CODES.BAD_REQUEST,
            sanitizeErrorMessage(journeysError.message, "Failed to create demo marketing journeys.")
          ),
          { status: 400 }
        );
      }
      summary.marketing_segments = segments.length;
      summary.marketing_templates = templates.length;
      summary.marketing_campaigns = campaignRows.length;
      summary.marketing_journeys = journeyRows.length;
    }
  }

  // Staff: departments, designations, employees ---------------------------------
  {
    const { count } = await supabase
      .from("departments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);
    if ((count ?? 0) === 0) {
      const { data: departments, error: deptError } = await supabase
        .from("departments")
        .insert(
          DEMO_DEPARTMENTS.map((d) => ({
            tenant_id: orgId,
            name: d.name,
            code: d.code,
            parent_id: null,
            sort_order: d.sort_order,
          }))
        )
        .select("id");
      if (deptError || !departments?.length) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(deptError?.message ?? "", "Failed to seed departments.")),
          { status: 400 }
        );
      }

      const designationRows = DEMO_DESIGNATIONS.map((d) => ({
        tenant_id: orgId,
        name: d.name,
        department_id: departments[d.departmentIndex]?.id ?? null,
        sort_order: d.sort_order,
      }));
      const { data: designations, error: desError } = await supabase
        .from("designations")
        .insert(designationRows)
        .select("id");
      if (desError || !designations?.length) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(desError?.message ?? "", "Failed to seed designations.")),
          { status: 400 }
        );
      }

      const employeeRows = DEMO_EMPLOYEES.map((e) => ({
        tenant_id: orgId,
        profile_id: null,
        department_id: departments[e.departmentIndex]?.id ?? departments[0]!.id,
        designation_id: designations[e.designationIndex]?.id ?? designations[0]!.id,
        reports_to_id: null,
        employee_number: e.employee_number,
        join_date: e.join_date,
        leave_date: null,
        is_active: e.is_active,
      }));
      const { error: empError } = await supabase.from("employees").insert(employeeRows);
      if (empError) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(empError.message, "Failed to seed employees.")),
          { status: 400 }
        );
      }
      summary.departments = departments.length;
      summary.designations = designations.length;
      summary.employees = employeeRows.length;
    }
  }

  // Inventory: groups, items, warehouses, vendors, stock levels -----------------
  {
    const { count } = await supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);
    if ((count ?? 0) === 0) {
      const { data: groups, error: groupsError } = await supabase
        .from("inventory_item_groups")
        .insert(
          DEMO_INVENTORY_GROUPS.map((g) => ({
            tenant_id: orgId,
            name: g.name,
            description: g.description,
            sort_order: g.sort_order,
          }))
        )
        .select("id");
      if (groupsError || !groups?.length) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(groupsError?.message ?? "", "Failed to seed inventory groups.")),
          { status: 400 }
        );
      }

      const { data: items, error: itemsError } = await supabase
        .from("inventory_items")
        .insert(
          DEMO_INVENTORY_ITEMS.map((i) => ({
            tenant_id: orgId,
            group_id: groups[i.groupIndex]?.id ?? null,
            name: i.name,
            sku: i.sku,
            description: i.description,
            unit: i.unit,
            is_active: true,
            reorder_level: i.reorder_level,
            cost: i.cost,
            selling_price: i.selling_price,
            tax_rate: null,
            metadata: {},
          }))
        )
        .select("id");
      if (itemsError || !items?.length) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(itemsError?.message ?? "", "Failed to seed inventory items.")),
          { status: 400 }
        );
      }

      const { data: warehouses, error: whError } = await supabase
        .from("warehouses")
        .insert(
          DEMO_WAREHOUSES.map((w) => ({
            tenant_id: orgId,
            name: w.name,
            code: w.code,
            is_default: w.is_default,
          }))
        )
        .select("id");
      if (whError || !warehouses?.length) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(whError?.message ?? "", "Failed to seed warehouses.")),
          { status: 400 }
        );
      }

      const { error: vendorsError } = await supabase.from("vendors").insert(
        DEMO_VENDORS.map((v) => ({
          tenant_id: orgId,
          name: v.name,
          email: v.email,
          phone: v.phone,
          payment_terms: v.payment_terms,
        }))
      );
      if (vendorsError) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(vendorsError.message, "Failed to seed vendors.")),
          { status: 400 }
        );
      }

      const stockRows = DEMO_STOCK_LEVELS.filter(
        (s) => items[s.itemIndex] && warehouses[s.warehouseIndex]
      ).map((s) => ({
        tenant_id: orgId,
        item_id: items[s.itemIndex]!.id,
        variant_id: null,
        warehouse_id: warehouses[s.warehouseIndex]!.id,
        quantity: s.quantity,
      }));
      if (stockRows.length > 0) {
        const { error: stockError } = await supabase.from("inventory_stock_levels").insert(stockRows);
        if (stockError) {
          return NextResponse.json(
            apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(stockError.message, "Failed to seed stock levels.")),
            { status: 400 }
          );
        }
      }

      summary.inventory_groups = groups.length;
      summary.inventory_items = items.length;
      summary.warehouses = warehouses.length;
      summary.vendors = DEMO_VENDORS.length;
    }
  }

  // Inventory extended: purchase orders, bills, sales orders, picklists, packages, composite items -
  {
    const { count: poCount } = await supabase
      .from("purchase_orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);
    if ((poCount ?? 0) === 0) {
      const { data: vendors } = await supabase
        .from("vendors")
        .select("id")
        .eq("tenant_id", orgId)
        .order("created_at");
      const { data: warehouses } = await supabase
        .from("warehouses")
        .select("id")
        .eq("tenant_id", orgId)
        .order("created_at");
      const { data: invItems } = await supabase
        .from("inventory_items")
        .select("id")
        .eq("tenant_id", orgId)
        .order("created_at");

      if (
        vendors &&
        vendors.length > 0 &&
        warehouses &&
        warehouses.length > 0 &&
        invItems &&
        invItems.length > 0
      ) {
        const vendorIds = vendors.map((r) => r.id as string);
        const warehouseIds = warehouses.map((r) => r.id as string);
        const itemIds = invItems.map((r) => r.id as string);

        // Purchase orders + lines
        const poIds: string[] = [];
        for (const po of DEMO_PURCHASE_ORDERS) {
          const vendorId = vendorIds[po.vendorIndex];
          const warehouseId = warehouseIds[po.warehouseIndex] ?? null;
          if (!vendorId) continue;
          let totalAmount: number | null = null;
          for (const line of po.lines) {
            const itemId = itemIds[line.itemIndex];
            if (!itemId) continue;
            totalAmount = (totalAmount ?? 0) + line.quantity * line.unit_cost;
          }
          const { data: poRow, error: poErr } = await supabase
            .from("purchase_orders")
            .insert({
              tenant_id: orgId,
              vendor_id: vendorId,
              warehouse_id: warehouseId,
              status: po.status,
              order_number: po.order_number,
              order_date: po.order_date,
              expected_date: po.expected_date,
              currency: po.currency,
              total_amount: totalAmount,
              notes: null,
            })
            .select("id")
            .single();
          if (poErr || !poRow) continue;
          poIds.push(poRow.id as string);
          for (const line of po.lines) {
            const itemId = itemIds[line.itemIndex];
            if (!itemId) continue;
            await supabase.from("purchase_order_items").insert({
              tenant_id: orgId,
              purchase_order_id: poRow.id,
              item_id: itemId,
              variant_id: null,
              quantity: line.quantity,
              unit_cost: line.unit_cost,
              received_quantity: po.status === "received" ? line.quantity : 0,
            });
          }
        }
        summary.purchase_orders = poIds.length;

        // Vendor bills
        const billRows = DEMO_VENDOR_BILLS.filter((b) => vendorIds[b.vendorIndex]).map((b) => ({
          tenant_id: orgId,
          vendor_id: vendorIds[b.vendorIndex]!,
          purchase_order_id: b.purchaseOrderIndex != null && poIds[b.purchaseOrderIndex] ? poIds[b.purchaseOrderIndex]! : null,
          bill_number: b.bill_number,
          bill_date: b.bill_date,
          due_date: b.due_date,
          currency: "USD",
          amount: b.amount,
          status: b.status,
          notes: null,
        }));
        if (billRows.length > 0) {
          const { error: billErr } = await supabase.from("vendor_bills").insert(billRows);
          if (!billErr) summary.vendor_bills = billRows.length;
        }

        // Sales orders + lines
        const soIds: string[] = [];
        for (const so of DEMO_SALES_ORDERS) {
          let totalAmount: number | null = null;
          for (const line of so.lines) {
            if (itemIds[line.itemIndex]) {
              totalAmount = (totalAmount ?? 0) + line.quantity * line.unit_price;
            }
          }
          const { data: soRow, error: soErr } = await supabase
            .from("sales_orders")
            .insert({
              tenant_id: orgId,
              customer_id: null,
              status: so.status,
              order_number: so.order_number,
              order_date: so.order_date,
              expected_ship_date: so.expected_ship_date,
              currency: so.currency,
              total_amount: totalAmount,
              notes: null,
            })
            .select("id")
            .single();
          if (soErr || !soRow) continue;
          soIds.push(soRow.id as string);
          for (const line of so.lines) {
            const itemId = itemIds[line.itemIndex];
            if (!itemId) continue;
            await supabase.from("sales_order_items").insert({
              tenant_id: orgId,
              sales_order_id: soRow.id,
              item_id: itemId,
              variant_id: null,
              quantity: line.quantity,
              unit_price: line.unit_price,
            });
          }
        }
        summary.sales_orders = soIds.length;

        // Picklists
        const plIds: string[] = [];
        for (const pl of DEMO_PICKLISTS) {
          const soId = soIds[pl.salesOrderIndex];
          const whId = warehouseIds[pl.warehouseIndex];
          if (!soId || !whId) continue;
          const { data: plRow, error: plErr } = await supabase
            .from("picklists")
            .insert({
              tenant_id: orgId,
              sales_order_id: soId,
              warehouse_id: whId,
              status: pl.status,
              notes: null,
            })
            .select("id")
            .single();
          if (plErr || !plRow) continue;
          plIds.push(plRow.id as string);
        }
        summary.picklists = plIds.length;

        // Packages
        const pkgRows = DEMO_PACKAGES.filter((p) => plIds[p.picklistIndex]).map((p) => ({
          tenant_id: orgId,
          picklist_id: plIds[p.picklistIndex]!,
          carrier: p.carrier,
          tracking_number: p.tracking_number,
          status: p.status,
          shipped_at: p.status === "shipped" || p.status === "delivered" ? new Date().toISOString() : null,
          delivered_at: p.status === "delivered" ? new Date().toISOString() : null,
          notes: null,
        }));
        if (pkgRows.length > 0) {
          const { error: pkgErr } = await supabase.from("packages").insert(pkgRows);
          if (!pkgErr) summary.packages = pkgRows.length;
        }

        // Composite items + components
        const compIds: string[] = [];
        for (const comp of DEMO_COMPOSITE_ITEMS) {
          const parentItemId = itemIds[comp.inventoryItemIndex];
          if (!parentItemId) continue;
          const { data: compRow, error: compErr } = await supabase
            .from("composite_items")
            .insert({
              tenant_id: orgId,
              inventory_item_id: parentItemId,
              name: comp.name,
              description: comp.description,
            })
            .select("id")
            .single();
          if (compErr || !compRow) continue;
          compIds.push(compRow.id as string);
          for (const c of comp.components) {
            const itemId = itemIds[c.itemIndex];
            if (!itemId) continue;
            await supabase.from("composite_item_components").insert({
              tenant_id: orgId,
              composite_id: compRow.id,
              item_id: itemId,
              variant_id: null,
              quantity: c.quantity,
            });
          }
        }
        summary.composite_items = compIds.length;
      }
    }
  }

  // Menu (cafe only): categories, sub-categories, items, discounts -----------------
  if (tenant.industry === "cafe") {
    const { count: menuCount } = await supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);

    if ((menuCount ?? 0) === 0) {
      const { data: categories, error: catError } = await supabase
        .from("menu_categories")
        .insert(
          DEMO_MENU_CATEGORIES.map((c, i) => ({
            tenant_id: orgId,
            name: c.name,
            sort_order: c.sort_order ?? i,
          }))
        )
        .select("id");
      if (catError || !categories?.length) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(catError?.message ?? "", "Failed to seed menu categories.")),
          { status: 400 }
        );
      }

      const subCategoryIds: string[] = [];
      for (let i = 0; i < categories.length; i++) {
        const subs = DEMO_MENU_SUBCATEGORIES.filter((s) => s.categoryIndex === i);
        if (subs.length === 0) continue;
        const { data: inserted, error: subError } = await supabase
          .from("menu_sub_categories")
          .insert(
            subs.map((s, j) => ({
              tenant_id: orgId,
              category_id: categories[i]!.id,
              name: s.name,
              sort_order: s.sort_order ?? j,
            }))
          )
          .select("id");
        if (subError || !inserted?.length) {
          return NextResponse.json(
            apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(subError?.message ?? "", "Failed to seed menu sub-categories.")),
            { status: 400 }
          );
        }
        subCategoryIds.push(...inserted.map((r) => r.id as string));
      }

      const itemRows = DEMO_MENU_ITEMS.map((item, index) => ({
        tenant_id: orgId,
        name: item.name,
        description: item.description,
        long_description: null,
        price: item.price,
        discounted_price: null,
        sub_category_id: subCategoryIds[item.subCategoryIndex] ?? null,
        food_type: item.food_type,
        images: [],
        sort_order: item.sort_order ?? index,
        is_active: true,
        dietary_tags: item.dietary_tags ?? [],
        allergens: [],
        prep_time_minutes: item.prep_time_minutes,
        sku: null,
        unit: null,
        stock_quantity: null,
        minimum_stock: null,
        minimum_order: 1,
        inventory_item_id: null,
      }));
      const { error: itemsError } = await supabase.from("menu_items").insert(itemRows);
      if (itemsError) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(itemsError.message, "Failed to seed menu items.")),
          { status: 400 }
        );
      }

      const { error: discError } = await supabase.from("menu_discounts").insert(
        DEMO_MENU_DISCOUNTS.map((d) => ({
          tenant_id: orgId,
          name: d.name,
          type: d.type,
          value: d.value,
          is_active: true,
          description: d.description,
        }))
      );
      if (discError) {
        return NextResponse.json(
          apiError(API_ERROR_CODES.BAD_REQUEST, sanitizeErrorMessage(discError.message, "Failed to seed menu discounts.")),
          { status: 400 }
        );
      }

      summary.menu_categories = categories.length;
      summary.menu_sub_categories = subCategoryIds.length;
      summary.menu_items = itemRows.length;
      summary.menu_discounts = DEMO_MENU_DISCOUNTS.length;
    }
  }

  // Finance: chart of accounts, invoices, expense reports ---------------------
  {
    const { count: accountsCount } = await supabase
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);

    if ((accountsCount ?? 0) === 0) {
      const { data: accounts, error: accError } = await supabase
        .from("accounts")
        .insert(
          DEMO_ACCOUNTS.map((a) => ({
            tenant_id: orgId,
            code: a.code,
            name: a.name,
            type: a.type,
            subtype: a.subtype ?? null,
            is_active: true,
            parent_account_id: null,
            tax_rate_id: null,
            metadata: {},
          }))
        )
        .select("id, type");
      if (!accError && accounts?.length) {
        summary.accounts = accounts.length;

        const expenseAccountId = (accounts as { id: string; type: string }[]).find((a) => a.type === "expense")?.id;

        const { count: invoicesCount } = await supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", orgId);

        if ((invoicesCount ?? 0) === 0) {
          const currency = tenant.currency ?? "USD";
          for (const inv of DEMO_INVOICES) {
            let subtotal = 0;
            const invoiceLines: { description: string; quantity: number; unit_price: number; discount: number; line_total: number }[] = [];
            for (const line of inv.lines) {
              const discount = Number(line.discount) || 0;
              const lineTotal = Math.round((line.quantity * line.unit_price - discount) * 100) / 100;
              subtotal += lineTotal;
              invoiceLines.push({
                description: line.description,
                quantity: line.quantity,
                unit_price: line.unit_price,
                discount,
                line_total: lineTotal,
              });
            }
            const total = Math.round(subtotal * 100) / 100;
            const balance = inv.status === "paid" ? 0 : total;
            const { data: invRow, error: invErr } = await supabase
              .from("invoices")
              .insert({
                tenant_id: orgId,
                customer_id: null,
                invoice_number: inv.invoice_number,
                status: inv.status,
                invoice_date: inv.invoice_date,
                due_date: inv.due_date,
                currency,
                subtotal,
                tax_total: 0,
                discount_total: 0,
                total,
                balance,
                notes: null,
                source_sales_order_id: null,
              })
              .select("id")
              .single();
            if (invErr || !invRow) continue;
            for (const line of invoiceLines) {
              await supabase.from("invoice_lines").insert({
                tenant_id: orgId,
                invoice_id: invRow.id,
                item_id: null,
                description: line.description,
                quantity: line.quantity,
                unit_price: line.unit_price,
                discount: line.discount,
                tax_rate_id: null,
                line_total: line.line_total,
              });
            }
          }
          summary.invoices = DEMO_INVOICES.length;
        }

        if (expenseAccountId) {
          const { data: employeeRows } = await supabase
            .from("employees")
            .select("id")
            .eq("tenant_id", orgId)
            .order("created_at", { ascending: true });
          const employeeIds = (employeeRows ?? []).map((r) => r.id as string);

          const { count: expCount } = await supabase
            .from("expense_reports")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", orgId);

          if ((expCount ?? 0) === 0 && employeeIds.length > 0) {
            const currency = tenant.currency ?? "USD";
            for (const report of DEMO_EXPENSE_REPORTS) {
              const empId = employeeIds[report.employeeIndex];
              if (!empId) continue;
              let totalAmount = 0;
              for (const line of report.lines) totalAmount += line.amount;
              totalAmount = Math.round(totalAmount * 100) / 100;
              const { data: reportRow, error: reportErr } = await supabase
                .from("expense_reports")
                .insert({
                  tenant_id: orgId,
                  employee_id: empId,
                  report_number: report.report_number,
                  status: report.status,
                  currency,
                  total_amount: totalAmount,
                  submitted_at: report.status !== "draft" ? new Date().toISOString() : null,
                  approved_at: report.status === "approved" || report.status === "paid" ? new Date().toISOString() : null,
                  paid_at: report.status === "paid" ? new Date().toISOString() : null,
                })
                .select("id")
                .single();
              if (reportErr || !reportRow) continue;
              for (const line of report.lines) {
                await supabase.from("expense_lines").insert({
                  tenant_id: orgId,
                  expense_report_id: reportRow.id,
                  category_account_id: expenseAccountId,
                  description: line.description,
                  expense_date: line.expense_date.slice(0, 10),
                  amount: line.amount,
                  tax_rate_id: null,
                  receipt_url: null,
                });
              }
            }
            summary.expense_reports = DEMO_EXPENSE_REPORTS.filter(
              (r) => employeeIds[r.employeeIndex]
            ).length;
          }
        }
      }
    } else {
      const { count: invoicesCount } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", orgId);
      if ((invoicesCount ?? 0) === 0) {
        const { data: accounts } = await supabase
          .from("accounts")
          .select("id")
          .eq("tenant_id", orgId)
          .limit(1);
        if (accounts?.length) {
          const currency = tenant.currency ?? "USD";
          for (const inv of DEMO_INVOICES) {
            let subtotal = 0;
            const invoiceLines: { description: string; quantity: number; unit_price: number; discount: number; line_total: number }[] = [];
            for (const line of inv.lines) {
              const discount = Number(line.discount) || 0;
              const lineTotal = Math.round((line.quantity * line.unit_price - discount) * 100) / 100;
              subtotal += lineTotal;
              invoiceLines.push({
                description: line.description,
                quantity: line.quantity,
                unit_price: line.unit_price,
                discount,
                line_total: lineTotal,
              });
            }
            const total = Math.round(subtotal * 100) / 100;
            const balance = inv.status === "paid" ? 0 : total;
            const { data: invRow, error: invErr } = await supabase
              .from("invoices")
              .insert({
                tenant_id: orgId,
                customer_id: null,
                invoice_number: inv.invoice_number,
                status: inv.status,
                invoice_date: inv.invoice_date,
                due_date: inv.due_date,
                currency,
                subtotal,
                tax_total: 0,
                discount_total: 0,
                total,
                balance,
                notes: null,
                source_sales_order_id: null,
              })
              .select("id")
              .single();
            if (invErr || !invRow) continue;
            for (const line of invoiceLines) {
              await supabase.from("invoice_lines").insert({
                tenant_id: orgId,
                invoice_id: invRow.id,
                item_id: null,
                description: line.description,
                quantity: line.quantity,
                unit_price: line.unit_price,
                discount: line.discount,
                tax_rate_id: null,
                line_total: line.line_total,
              });
            }
          }
          summary.invoices = DEMO_INVOICES.length;
        }
      }

      const { count: expCount } = await supabase
        .from("expense_reports")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", orgId);
      if ((expCount ?? 0) === 0) {
        const { data: accounts } = await supabase
          .from("accounts")
          .select("id, type")
          .eq("tenant_id", orgId);
        const expenseAccountId = (accounts ?? []).find((a: { type: string }) => a.type === "expense")?.id;
        const { data: employeeRows } = await supabase
          .from("employees")
          .select("id")
          .eq("tenant_id", orgId)
          .order("created_at", { ascending: true });
        const employeeIds = (employeeRows ?? []).map((r) => r.id as string);
        if (expenseAccountId && employeeIds.length > 0) {
          const currency = tenant.currency ?? "USD";
          for (const report of DEMO_EXPENSE_REPORTS) {
            const empId = employeeIds[report.employeeIndex];
            if (!empId) continue;
            let totalAmount = 0;
            for (const line of report.lines) totalAmount += line.amount;
            totalAmount = Math.round(totalAmount * 100) / 100;
            const { data: reportRow, error: reportErr } = await supabase
              .from("expense_reports")
              .insert({
                tenant_id: orgId,
                employee_id: empId,
                report_number: report.report_number,
                status: report.status,
                currency,
                total_amount: totalAmount,
                submitted_at: report.status !== "draft" ? new Date().toISOString() : null,
                approved_at: report.status === "approved" || report.status === "paid" ? new Date().toISOString() : null,
                paid_at: report.status === "paid" ? new Date().toISOString() : null,
              })
              .select("id")
              .single();
            if (reportErr || !reportRow) continue;
            for (const line of report.lines) {
              await supabase.from("expense_lines").insert({
                tenant_id: orgId,
                expense_report_id: reportRow.id,
                category_account_id: expenseAccountId,
                description: line.description,
                expense_date: line.expense_date.slice(0, 10),
                amount: line.amount,
                tax_rate_id: null,
                receipt_url: null,
              });
            }
          }
          summary.expense_reports = DEMO_EXPENSE_REPORTS.filter(
            (r) => employeeIds[r.employeeIndex]
          ).length;
        }
      }
    }
  }

  // Lead sources: add 2–3 extra if tenant has few (e.g. only default 4) -------
  {
    const { count } = await supabase
      .from("lead_sources")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId);
    if ((count ?? 0) <= 5 && DEMO_LEAD_SOURCES_EXTRA.length > 0) {
      const { data: existing } = await supabase
        .from("lead_sources")
        .select("name")
        .eq("tenant_id", orgId);
      const existingNames = new Set((existing ?? []).map((r) => String(r.name).trim().toLowerCase()));
      const toInsert = DEMO_LEAD_SOURCES_EXTRA.filter(
        (s) => !existingNames.has(s.name.trim().toLowerCase())
      );
      if (toInsert.length > 0) {
        const baseSort = (count ?? 0);
        const { error: srcError } = await supabase.from("lead_sources").insert(
          toInsert.map((s, i) => ({
            tenant_id: orgId,
            name: s.name,
            color: s.color ?? "#64748b",
            sort_order: baseSort + i,
            created_by: user.id,
          }))
        );
        if (!srcError) summary.lead_sources_extra = toInsert.length;
      }
    }
  }

  return NextResponse.json(apiSuccess({ summary }));
}

