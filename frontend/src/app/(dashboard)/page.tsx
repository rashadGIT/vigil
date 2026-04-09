'use client';

import { useQuery } from '@tanstack/react-query';
import { FolderOpen, AlertCircle, CalendarDays, FileSignature } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { RecentCasesTable } from '@/components/dashboard/recent-cases-table';
import { getDashboardStats } from '@/lib/api/dashboard';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      {/* D-08/D-09: 4 stat cards in responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Cases"
          value={stats?.activeCases}
          icon={FolderOpen}
          description="New + in progress"
          loading={isLoading}
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueTasks}
          icon={AlertCircle}
          description="Past due date"
          loading={isLoading}
        />
        <StatCard
          title="Cases This Month"
          value={stats?.casesThisMonth}
          icon={CalendarDays}
          description="Created in current month"
          loading={isLoading}
        />
        <StatCard
          title="Pending Signatures"
          value={stats?.pendingSignatures}
          icon={FileSignature}
          description="Awaiting family signature"
          loading={isLoading}
        />
      </div>

      {/* D-10: Recent cases table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Cases</h2>
        <RecentCasesTable />
      </div>
    </div>
  );
}
