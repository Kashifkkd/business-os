import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Globe,
  Palette,
  Users,
  Shield,
  Bell,
  Plug,
  CreditCard,
} from "lucide-react";

export interface SettingsNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SettingsNavSection {
  title: string;
  items: SettingsNavItem[];
}

/** Build settings nav sections for a given org base path. Extensible for future modules. */
export function getSettingsNavSections(orgId: string): SettingsNavSection[] {
  const base = `/${orgId}`;
  return [
    {
      title: "Organization",
      items: [
        { label: "Organization Info", href: `${base}/settings/general`, icon: Building2 },
        { label: "Localization", href: `${base}/settings/localization`, icon: Globe },
        { label: "Branding", href: `${base}/settings/branding`, icon: Palette },
      ],
    },
    {
      title: "Team",
      items: [
        { label: "Members", href: `${base}/settings/members`, icon: Users },
        { label: "Roles & Permissions", href: `${base}/settings/roles`, icon: Shield },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Notifications", href: `${base}/settings/notifications`, icon: Bell },
        { label: "Integrations", href: `${base}/settings/integrations`, icon: Plug },
        { label: "Billing", href: `${base}/settings/billing`, icon: CreditCard },
      ],
    },
  ];
}
