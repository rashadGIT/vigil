'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/format-date';

function FollowUpList({ caseId }: { caseId: string }) {
  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['followUps', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}/follow-ups`).then((r) => r.data),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (followUps.length === 0) return <p className="text-sm text-muted-foreground">No follow-ups scheduled yet.</p>;

  return (
    <div className="rounded-md border divide-y">
      {followUps.map((f: any) => (
        <div key={f.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium">{f.template}</p>
            <p className="text-xs text-muted-foreground">Scheduled for {formatDate(f.scheduledFor)}</p>
          </div>
          <Badge variant={f.status === 'sent' ? 'default' : 'outline'}>
            {f.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default function CaseFollowUpsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <div>
        <p className="text-xs text-muted-foreground mb-4">
          Grief follow-ups are automatically scheduled by n8n workflows. Read-only display.
        </p>
        <FollowUpList caseId={id} />
      </div>
    </div>
  );
}
