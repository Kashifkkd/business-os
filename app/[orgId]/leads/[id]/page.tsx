"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLead, useUpdateLead, useDeleteLead } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Save, X } from "lucide-react";

const LEAD_STATUS_OPTIONS = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
] as const;

const SOURCE_OPTIONS = [
  { value: "", label: "—" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manual" },
  { value: "cold_outbound", label: "Cold outbound" },
] as const;

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const leadId = params?.id as string;
  const [editing, setEditing] = useState(false);

  const { data: lead, isLoading } = useLead(orgId, leadId);
  const updateLead = useUpdateLead(orgId, leadId);
  const deleteLead = useDeleteLead(orgId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  const startEditing = () => {
    if (!lead) return;
    setName(lead.name);
    setEmail(lead.email ?? "");
    setPhone(lead.phone ?? "");
    setCompany(lead.company ?? "");
    setSource(lead.source ?? "");
    setStatus(lead.status);
    setNotes(lead.notes ?? "");
    setEditing(true);
  };

  const handleSave = () => {
    updateLead.mutate(
      {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        source: source.trim() || null,
        status: status.trim() || "new",
        notes: notes.trim() || null,
      },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleDelete = () => {
    if (!lead || !confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
    deleteLead.mutate(lead.id, {
      onSuccess: () => router.push(`/${orgId}/leads`),
    });
  };

  if (!orgId || !leadId) return null;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-xl p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container mx-auto max-w-xl p-4">
        <p className="text-destructive text-sm">Lead not found.</p>
        <Button variant="link" asChild className="mt-2 p-0">
          <Link href={`/${orgId}/leads`}>Back to leads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgId}/leads`}>
            <ArrowLeft className="size-4" />
            Back to leads
          </Link>
        </Button>
        {!editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteLead.isPending}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateLead.isPending || !name.trim()}>
              <Save className="size-4" />
              {updateLead.isPending ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="size-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{lead.name}</h1>
            <Badge variant="secondary" className="capitalize">
              {lead.status}
            </Badge>
          </div>
          {lead.company && (
            <p className="text-muted-foreground text-sm">{lead.company}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={source || "none"} onValueChange={(v) => setSource(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || "none"} value={opt.value || "none"}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </>
          ) : (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{lead.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{lead.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Company</dt>
                <dd>{lead.company ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd>{lead.source ?? "—"}</dd>
              </div>
              {lead.notes && (
                <div>
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="whitespace-pre-wrap">{lead.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(lead.created_at).toLocaleString()}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
