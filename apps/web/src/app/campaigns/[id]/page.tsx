import { DashboardShell } from "../../components/dashboard-shell";
import { AnalyticsGrid } from "../../components/analytics-grid";

export default function CampaignDetailPage() {
  return (
    <DashboardShell title="Campaign Performance">
      <AnalyticsGrid />
    </DashboardShell>
  );
}
