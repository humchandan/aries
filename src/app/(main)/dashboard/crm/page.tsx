import { AdminGuard } from "../_components/admin-guard";
import { AdminKycApproval } from "./_components/admin-kyc-approval";
import { KpiCards } from "./_components/kpi-cards";
import { OpportunitiesSection } from "./_components/opportunities-section";
import { PipelineActivity } from "./_components/pipeline-activity";
import { TaskReminders } from "./_components/task-reminders";

export default function Page() {
  return (
    <AdminGuard>
      <div className="flex flex-col gap-4 md:gap-6">
        <KpiCards />
        <PipelineActivity />
        <AdminKycApproval />
        <TaskReminders />
        <OpportunitiesSection />
      </div>
    </AdminGuard>
  );
}
