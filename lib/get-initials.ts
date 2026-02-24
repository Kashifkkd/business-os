export function getInitials(name: string, fallback?: string | null): string {
    if (fallback?.trim()) return fallback.trim().slice(0, 2).toUpperCase();
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase() || "—";
}