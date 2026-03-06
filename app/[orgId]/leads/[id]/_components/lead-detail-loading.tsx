export function LeadDetailLoading() {
  return (
    <div className="flex h-full w-full flex-col p-6">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-9 w-64 rounded bg-muted" />
        </div>
        <div className="h-11 w-full max-w-2xl rounded-full bg-muted" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="h-48 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
          </div>
          <div className="h-96 rounded-xl bg-muted lg:col-span-8" />
        </div>
      </div>
    </div>
  );
}
