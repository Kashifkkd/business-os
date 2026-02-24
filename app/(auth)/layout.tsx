import { GridSmallBackground } from "@/components/grid-small-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GridSmallBackground>{children}</GridSmallBackground>;
}
