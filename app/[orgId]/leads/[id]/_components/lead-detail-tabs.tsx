"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadActivityTab } from "./lead-activity-tab";
import { LeadNotesTab } from "./lead-notes-tab";
import { LeadCallsTab } from "./lead-calls-tab";
import { LeadMeetingsTab } from "./lead-meetings-tab";
import { ComingSoonPlaceholder } from "./coming-soon-placeholder";
import type { LeadActivity } from "@/lib/supabase/types";
import { MessageSquare, Mail, MessageCircle, FolderOpen, StickyNote, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Filter } from "lucide-react";

const TAB_VALUES = ["activity", "notes", "calls", "meetings", "emails", "communications", "documents"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isValidTab(tab: string | null): tab is TabValue {
  return tab !== null && TAB_VALUES.includes(tab as TabValue);
}

type LeadDetailTabsProps = {
  orgId: string;
  leadId: string;
  activities: LeadActivity[];
  activitiesLoading: boolean;
};

export function LeadDetailTabs({
  orgId,
  leadId,
  activities,
  activitiesLoading,
}: LeadDetailTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const activeTab = isValidTab(tabFromUrl) ? tabFromUrl : "activity";

  const setTabInUrl = useCallback(
    (tab: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/${orgId}/leads/${leadId}?${params.toString()}`, { scroll: false });
    },
    [orgId, leadId, router, searchParams]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      if (isValidTab(value)) setTabInUrl(value);
    },
    [setTabInUrl]
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex h-full w-full flex-col gap-0">
      <Card className="flex h-full w-full min-h-0 flex-col py-0 gap-0">
        <TabsList className="w-full shrink-0 rounded-b-none border-b border-border px-4">
          <TabsTrigger value="activity">
            <MessageSquare className="size-3.5" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="size-3.5" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="calls">
            <Phone className="size-3.5" />
            Calls
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Video className="size-3.5" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="emails">
            <Mail className="size-3.5" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="communications">
            <MessageCircle className="size-3.5" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FolderOpen className="size-3.5" />
            Documents
          </TabsTrigger>
        </TabsList>
        <CardContent className="min-h-0 flex-1 overflow-hidden rounded-t-none border-0 p-0 pt-0">
          <TabsContent value="activity" className="mt-0 flex h-full flex-col overflow-hidden data-[state=inactive]:hidden">
            <LeadActivityTab activities={activities} isLoading={activitiesLoading} />
          </TabsContent>
          <TabsContent value="notes" className="mt-0 flex h-full flex-col overflow-hidden data-[state=inactive]:hidden">
            <LeadNotesTab
              orgId={orgId}
              leadId={leadId}
              activities={activities}
              activitiesLoading={activitiesLoading}
            />
          </TabsContent>
          <TabsContent value="calls" className="mt-0 flex h-full flex-col overflow-hidden data-[state=inactive]:hidden">
            <LeadCallsTab orgId={orgId} leadId={leadId} />
          </TabsContent>
          <TabsContent value="meetings" className="mt-0 flex h-full flex-col overflow-hidden data-[state=inactive]:hidden">
            <LeadMeetingsTab orgId={orgId} leadId={leadId} />
          </TabsContent>
          <TabsContent value="emails" className="mt-0 h-full overflow-auto data-[state=inactive]:hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-medium">Emails</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled>
                  <ArrowUpDown className="size-3.5" />
                  Sort
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  <Filter className="size-3.5" />
                  Filters
                </Button>
              </div>
            </div>
            <div className="p-4">
              <ComingSoonPlaceholder title="Emails" />
            </div>
          </TabsContent>
          <TabsContent value="communications" className="mt-0 h-full overflow-auto p-4 data-[state=inactive]:hidden">
            <ComingSoonPlaceholder title="Communications" />
          </TabsContent>
          <TabsContent value="documents" className="mt-0 h-full overflow-auto p-4 data-[state=inactive]:hidden">
            <ComingSoonPlaceholder title="Documents" />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
