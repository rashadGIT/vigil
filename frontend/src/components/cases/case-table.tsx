'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CaseStatusBadge } from './case-status-badge';
import { getCases, type CaseFilters } from '@/lib/api/cases';
import { formatRelative } from '@/lib/utils/format-date';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { ICase } from '@vigil/shared-types';

const columnHelper = createColumnHelper<ICase>();

const PAGE_SIZE = 10;

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <ChevronUp className="inline h-3.5 w-3.5 ml-1" />;
  if (isSorted === 'desc') return <ChevronDown className="inline h-3.5 w-3.5 ml-1" />;
  return <ChevronsUpDown className="inline h-3.5 w-3.5 ml-1 text-muted-foreground" />;
}

const baseColumns = [
  columnHelper.accessor('deceasedName', {
    id: 'deceasedName',
    header: ({ column }) => (
      <button
        className="flex items-center font-medium hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        aria-label="Sort by deceased name"
      >
        Deceased
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
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
    id: 'updatedAt',
    header: ({ column }) => (
      <button
        className="flex items-center font-medium hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        aria-label="Sort by last updated"
      >
        Last updated
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

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
    state: { sorting, pagination: { pageIndex, pageSize: PAGE_SIZE } },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPageIndex(0);
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize: PAGE_SIZE }) : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
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

  const totalRows = cases.length;
  const firstRow = pageIndex * PAGE_SIZE + 1;
  const lastRow = Math.min((pageIndex + 1) * PAGE_SIZE, totalRows);

  return (
    <div className="space-y-3">
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
                tabIndex={0}
                onClick={() => router.push(`/cases/${row.original.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/cases/${row.original.id}`);
                  }
                }}
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

      {totalRows > PAGE_SIZE && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing {firstRow}–{lastRow} of {totalRows} cases
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => p + 1)}
              disabled={lastRow >= totalRows}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
