import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BrandingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Branding</h1>
        <p className="text-muted-foreground text-sm">
          Logo, colors, and brand assets (coming soon).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Brand assets</CardTitle>
          <CardDescription>
            Custom logo and branding will be configurable here. This section is reserved for a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Placeholder — future ready.</p>
        </CardContent>
      </Card>
    </div>
  );
}
