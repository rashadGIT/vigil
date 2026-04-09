import { Suspense } from 'react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseOverview } from '@/components/cases/case-overview';

export default function CaseWorkspacePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <CaseWorkspaceTabs caseId={params.id} />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <CaseOverview caseId={params.id} />
      </Suspense>
    </div>
  );
}
