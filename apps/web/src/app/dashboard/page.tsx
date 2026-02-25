import { DashboardShell } from "../components/dashboard-shell";
import { AnalyticsGrid } from "../components/analytics-grid";

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <AnalyticsGrid />
    </DashboardShell>
  );
}
