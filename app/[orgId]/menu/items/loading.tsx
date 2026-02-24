import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";

export default function MenuItemsLoading() {
  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <div className="bg-muted h-6 w-32 animate-pulse rounded" />
        <div className="bg-muted mt-1 h-4 w-64 animate-pulse rounded" />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="bg-muted h-4 w-28 animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="bg-muted h-8 w-20 animate-pulse rounded-md" />
          <div className="bg-muted h-8 w-40 animate-pulse rounded-md" />
          <div className="bg-muted h-8 w-20 animate-pulse rounded-md" />
          <div className="bg-muted h-8 w-16 animate-pulse rounded-md" />
        </div>
      </div>
      <TableLoadingSkeleton columnCount={9} rowCount={10} compact />
    </div>
  );
}
