'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';

function ObituaryEditor({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['obituary', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}/obituary`).then((r) => r.data),
  });

  const [draft, setDraft] = useState('');
  useEffect(() => { if (data?.draft) setDraft(data.draft); }, [data]);

  const saveMutation = useMutation({
    mutationFn: (text: string) => apiClient.patch(`/cases/${caseId}/obituary`, { draft: text }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['obituary', caseId] }); toast.success('Obituary saved.'); },
  });

  const approveMutation = useMutation({
    mutationFn: () => apiClient.patch(`/cases/${caseId}/obituary/approve`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['obituary', caseId] }); toast.success('Obituary approved.'); },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4 max-w-2xl">
      {data?.approvedText && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3">
          <p className="text-xs font-medium text-green-800 mb-1">Approved</p>
          <p className="text-sm text-green-900 whitespace-pre-wrap">{data.approvedText}</p>
        </div>
      )}
      <Textarea
        rows={12}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Obituary draft will appear here after intake is submitted..."
        className="font-mono text-sm"
      />
      <div className="flex gap-3">
        <Button size="sm" onClick={() => saveMutation.mutate(draft)} disabled={saveMutation.isPending}>Save Draft</Button>
        <Button size="sm" variant="outline" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending || !draft}>Approve</Button>
      </div>
    </div>
  );
}

export default function CaseObituaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <ObituaryEditor caseId={id} />
    </div>
  );
}
