'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CaseStatusBadge } from './case-status-badge';
import { getCases, type CaseFilters } from '@/lib/api/cases';
import { formatRelative } from '@/lib/utils/format-date';
import type { ICase } from '@vigil/shared-types';

const columnHelper = createColumnHelper<ICase>();

const baseColumns = [
  columnHelper.accessor('deceasedName', {
    id: 'deceasedName',
    header: () => <span className="font-medium">Deceased</span>,
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('status', {
    header: () => <span className="font-medium">Status</span>,
    cell: (info) => <CaseStatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('assignedToId', {
    header: () => <span className="font-medium">Assigned</span>,
    cell: (info) => (
      <span className="text-muted-foreground text-sm">{info.getValue() ?? '—'}</span>
    ),
  }),
  columnHelper.accessor('updatedAt', {
    header: () => <span className="font-medium">Last updated</span>,
    cell: (info) => (
      <span className="text-muted-foreground text-sm">{formatRelative(info.getValue())}</span>
    ),
  }),
];

const overdueColumn = columnHelper.accessor('overdueTaskCount', {
  id: 'overdueTaskCount',
  header: () => <span className="font-medium">Overdue Tasks</span>,
  cell: (info) => {
    const count = info.getValue() ?? 0;
    return count > 0 ? (
      <Badge variant="destructive" className="text-xs">{count} overdue</Badge>
    ) : null;
  },
});

function buildFilters(filter?: string): CaseFilters {
  if (filter === 'active' || filter === 'overdue' || filter === 'this-month' || filter === 'pending-signatures') {
    return { dashboardFilter: filter };
  }
  return {};
}

export function CaseTable({ filter }: { filter?: string }) {
  const router = useRouter();
  const { data: cases = [], isLoading, error, refetch } = useQuery({
    queryKey: ['cases', filter],
    queryFn: () => getCases(buildFilters(filter)),
  });

  const columns = filter === 'overdue'
    ? [...baseColumns, overdueColumn]
    : baseColumns;

  const table = useReactTable({
    data: cases,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Failed to load cases.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center space-y-2">
        <p className="text-muted-foreground text-sm">No cases yet.</p>
        <p className="text-xs text-muted-foreground">
          Share your intake form link to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/cases/${row.original.id}`)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
