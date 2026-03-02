"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSpaces,
  useTasks,
} from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import type { Task } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TasksCalendarPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const base = `/${orgId}`;
  const spaceId = searchParams.get("space_id") ?? "";

  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const { data: spaces, isLoading: spacesLoading } = useSpaces(orgId);
  const effectiveSpaceId = spaceId || spaces?.[0]?.id;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const dueAfter = format(monthStart, "yyyy-MM-dd");
  const dueBefore = format(monthEnd, "yyyy-MM-dd");

  const { data: tasksResult, isLoading: tasksLoading } = useTasks(
    orgId,
    {
      space_id: effectiveSpaceId ?? "",
      page: 1,
      pageSize: 500,
      due_after: dueAfter,
      due_before: dueBefore,
    },
    { enabled: !!effectiveSpaceId }
  );

  useEffect(() => {
    if (effectiveSpaceId && !spaceId) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("space_id", effectiveSpaceId);
      router.replace(`${base}/tasks/calendar?${next.toString()}`);
    }
  }, [base, effectiveSpaceId, spaceId, router, searchParams]);

  const setSpace = (id: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (id) next.set("space_id", id);
    else next.delete("space_id");
    router.push(`${base}/tasks/calendar?${next.toString()}`);
  };

  const tasks = tasksResult?.items ?? [];
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      const key = t.due_date.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const rangeStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  }, [currentMonth]);

  const weeks = useMemo(() => {
    const w: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      w.push(calendarDays.slice(i, i + 7));
    }
    return w;
  }, [calendarDays]);

  if (spacesLoading || !spaces?.length) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={(spaceId || effectiveSpaceId) ?? ""} onValueChange={setSpace}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium text-sm">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <Button asChild>
          <Link href={`${base}/tasks/new?space_id=${effectiveSpaceId}`}>
            New task
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="grid grid-cols-7 text-muted-foreground text-xs font-medium border-b bg-muted/50">
          {WEEKDAY_HEADERS.map((d) => (
            <div key={d} className="p-2 text-center">
              {d}
            </div>
          ))}
        </div>
        {tasksLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="divide-y divide-border">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 min-h-[100px]">
                {week.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayTasks = tasksByDate.get(dateKey) ?? [];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isCurrentDay = isToday(day);
                  return (
                    <div
                      key={dateKey}
                      className={cn(
                        "border-r border-border last:border-r-0 p-1.5 flex flex-col",
                        !isCurrentMonth && "bg-muted/30",
                        isCurrentDay && "bg-primary/5"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-medium mb-1",
                          !isCurrentMonth && "text-muted-foreground/70",
                          isCurrentDay && "text-primary"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="flex-1 overflow-y-auto space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <Link
                            key={task.id}
                            href={`${base}/tasks/${task.id}`}
                            className="block rounded px-1.5 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 truncate"
                          >
                            {task.title}
                          </Link>
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-muted-foreground text-[10px] px-1">
                            +{dayTasks.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
