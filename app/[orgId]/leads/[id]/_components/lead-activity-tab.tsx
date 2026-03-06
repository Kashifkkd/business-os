"use client";

import type { LeadActivity } from "@/lib/supabase/types";

type LeadActivityTabProps = {
  activities: LeadActivity[];
  isLoading: boolean;
};

export function LeadActivityTab({ activities, isLoading }: LeadActivityTabProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : activities.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          <ul className="space-y-4">
            {activities.map((a) => (
              <li key={a.id} className="flex gap-3 border-l-2 border-border pl-4">
                <div className="flex-1 space-y-0.5">
                  <span className="text-xs text-muted-foreground capitalize">
                    {a.type.replace("_", " ")} ·{" "}
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                  {a.content &&
                    (a.type === "note" && a.content.startsWith("<") ? (
                      <div
                        className="text-sm text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_p]:my-1"
                        dangerouslySetInnerHTML={{ __html: a.content }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-foreground">{a.content}</p>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
