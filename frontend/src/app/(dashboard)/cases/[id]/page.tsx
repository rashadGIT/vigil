import { Suspense } from 'react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseOverview } from '@/components/cases/case-overview';

export default async function CaseWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <CaseOverview caseId={id} />
      </Suspense>
    </div>
  );
}
