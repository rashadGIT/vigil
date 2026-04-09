import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { TaskList } from '@/components/tasks/task-list';

export default function CaseTasksPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <CaseWorkspaceTabs caseId={params.id} />
      <TaskList caseId={params.id} />
    </div>
  );
}
