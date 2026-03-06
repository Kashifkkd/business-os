export function ComingSoonPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <p className="text-muted-foreground text-sm">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground/70">Coming soon</p>
    </div>
  );
}
