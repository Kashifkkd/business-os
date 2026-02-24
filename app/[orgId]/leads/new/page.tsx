"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateLead } from "@/hooks/use-leads";
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
import { ArrowLeft } from "lucide-react";

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

export default function NewLeadPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<string>("new");
  const [notes, setNotes] = useState("");

  const createLead = useCreateLead(orgId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrim = name.trim();
    if (!nameTrim) return;
    createLead.mutate(
      {
        name: nameTrim,
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        source: source.trim() || null,
        status: status.trim() || "new",
        notes: notes.trim() || null,
      },
      {
        onSuccess: (data) => {
          router.push(`/${orgId}/leads/${data.id}`);
        },
        onError: () => {},
      }
    );
  };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-xl p-4">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgId}/leads`}>
            <ArrowLeft className="size-4" />
            Back to leads
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold">New lead</h1>
          <p className="text-muted-foreground text-sm">
            Add a new lead or inquiry.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
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
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
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
                placeholder="Notes..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createLead.isPending || !name.trim()}>
                {createLead.isPending ? "Creating…" : "Create lead"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${orgId}/leads`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
