import { DashboardLayoutWrapper } from "./dashboard-layout-wrapper";

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
