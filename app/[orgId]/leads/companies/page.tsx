"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from "@/hooks/use-companies";
import { useOrganization } from "@/hooks/use-organization";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { ShowingRange } from "@/components/showing-range";
import { SearchBox } from "@/components/search-box";
import { DateDisplay } from "@/components/date-display";
import { DisplayName } from "@/components/display-name";
import { Building2, Plus, Trash2, Pencil, MoreVertical, RefreshCw, Loader2 } from "lucide-react";

export default function LeadCompaniesPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dialogName, setDialogName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { user } = useUser();
  const { organization } = useOrganization(orgId);
  const { data: companies = [], isLoading, refetch, isRefetching } = useCompanies(orgId);
  const currentUserId = user?.id ?? null;
  const createCompany = useCreateCompany(orgId);
  const updateCompany = useUpdateCompany(orgId);
  const deleteCompany = useDeleteCompany(orgId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, search]);

  const locale = organization?.locale ?? undefined;
  const timeFormat = organization?.time_format ?? undefined;
  const isPending = createCompany.isPending || updateCompany.isPending || deleteCompany.isPending;

  const openAdd = () => {
    setDialogName("");
    setAddDialogOpen(true);
  };

  const openEdit = (id: string, name: string) => {
    setEditingId(id);
    setDialogName(name);
    setEditDialogOpen(true);
  };

  const handleAdd = () => {
    const name = dialogName.trim();
    if (!name || createCompany.isPending) return;
    createCompany.mutate(
      { name },
      {
        onSuccess: () => {
          setDialogName("");
          setAddDialogOpen(false);
        },
      }
    );
  };

  const handleEdit = () => {
    const name = dialogName.trim();
    if (!editingId || !name || updateCompany.isPending) return;
    updateCompany.mutate(
      { id: editingId, name },
      {
        onSuccess: () => {
          setEditingId(null);
          setDialogName("");
          setEditDialogOpen(false);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (deleteCompany.isPending) return;
    deleteCompany.mutate(id);
  };

  if (!orgId) return null;

  const from = filtered.length === 0 ? 0 : 1;
  const to = filtered.length;
  const total = filtered.length;

  return (
    <div className="container mx-auto p-4">
      <div>
        <h1 className="text-lg font-semibold">Companies</h1>
        <p className="text-muted-foreground text-sm">
          Manage companies for leads. Use these when assigning a company to a lead.
        </p>
      </div>

      {(createCompany.isError || updateCompany.isError || deleteCompany.isError) && (
        <p className="mb-2 text-sm text-destructive">
          {createCompany.error?.message ?? updateCompany.error?.message ?? deleteCompany.error?.message}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ShowingRange
            from={from}
            to={to}
            total={total}
            itemLabel="companies"
            emptyLabel="No companies"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              aria-label="Refresh"
            >
              {isRefetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            </Button>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search companies..."
              className="w-44"
            />
            <Button type="button" size="sm" onClick={openAdd}>
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="add-company-name">Company name</Label>
                <Input
                  id="add-company-name"
                  value={dialogName}
                  onChange={(e) => setDialogName(e.target.value)}
                  placeholder="e.g. Acme Inc."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!dialogName.trim() || createCompany.isPending}
              >
                {createCompany.isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-company-name">Company name</Label>
                <Input
                  id="edit-company-name"
                  value={dialogName}
                  onChange={(e) => setDialogName(e.target.value)}
                  placeholder="e.g. Acme Inc."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleEdit())}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleEdit}
                disabled={!dialogName.trim() || !editingId || updateCompany.isPending}
              >
                {updateCompany.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLoading || isRefetching ? (
          <TableLoadingSkeleton rowCount={5} columnCount={5} compact />
        ) : companies.length === 0 ? (
          <EmptyState
            title="No companies yet"
            description="Add companies using the Add button above. You can then assign them to leads."
            icon={Building2}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matching companies"
            description="Try a different search term."
            icon={Building2}
          />
        ) : (
          <div className="relative flex min-h-[260px] max-h-[520px] flex-1 flex-col overflow-y-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                <TableRow>
                  <TableHead className="px-3 text-xs">Name</TableHead>
                  <TableHead className="w-[80px] px-3 text-center text-xs">Leads</TableHead>
                  <TableHead className="w-[120px] px-3 text-xs">Created by</TableHead>
                  <TableHead className="w-[140px] px-3 text-xs">Created at</TableHead>
                  <TableHead className="w-[80px] px-3 text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((company) => (
                  <TableRow
                    key={company.id}
                    className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs"
                  >
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {company.lead_count ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <DisplayName
                      name={company.created_by_name?.trim() || "—"}
                      label={
                        currentUserId && company.created_by === currentUserId
                          ? "You"
                          : !company.created_by_name?.trim()
                            ? "You"
                            : undefined
                      }
                      size="sm"
                    />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <DateDisplay
                        value={company.created_at}
                        variant="datetimeWithAgo"
                        layout="column"
                        timeAgoWithinDays={7}
                        locale={locale}
                        timeFormat={timeFormat}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 data-[state=open]:bg-muted"
                            disabled={isPending}
                            aria-label="Actions"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEdit(company.id, company.name)}
                            disabled={isPending}
                          >
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(company.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
