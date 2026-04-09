import { Badge } from '@/components/ui/badge';
import { CaseStatus } from '@vigil/shared-types';
import { cn } from '@/lib/utils/cn';

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  [CaseStatus.new]: {
    label: 'New',
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  },
  [CaseStatus.in_progress]: {
    label: 'In Progress',
    className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  [CaseStatus.completed]: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  },
  [CaseStatus.archived]: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
  },
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const config = statusConfig[status] ?? statusConfig[CaseStatus.new];
  return (
    <Badge variant="outline" className={cn('font-medium text-xs', config.className)}>
      {config.label}
    </Badge>
  );
}
