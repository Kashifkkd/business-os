import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 max-w-md" />
      </div>
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 max-w-xl" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex flex-col items-start gap-2">
              <Skeleton className="size-16 shrink-0 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
          </div>
          <div className="border-t pt-6 space-y-4">
            <Skeleton className="h-4 w-28" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
          </div>
          <div className="border-t pt-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-28 rounded-md" />
        </CardFooter>
      </Card>
    </div>
  );
}
