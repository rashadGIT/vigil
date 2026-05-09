'use client';

import { useQuery } from '@tanstack/react-query';
import { FolderOpen, AlertCircle, CalendarDays, FileSignature, DollarSign, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { RecentCasesTable } from '@/components/dashboard/recent-cases-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardStats } from '@/lib/api/dashboard';
import { getRevenueReport } from '@/lib/api/revenue';

function formatCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function MonthlyBarChart({ data }: { data: { month: string; count: number; revenue: number }[] }) {
  const last6 = data.slice(-6);
  const maxCount = Math.max(...last6.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 h-32">
        {last6.map((d) => {
          const heightPct = Math.round((d.count / maxCount) * 100);
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{d.count}</span>
              <div
                className="w-full rounded-t-sm bg-primary/80 transition-all"
                style={{ height: `${Math.max(heightPct, 4)}%` }}
                title={`${d.month}: ${d.count} cases, ${formatCurrency(d.revenue)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {last6.map((d) => (
          <div key={d.month} className="flex-1 text-center">
            <span className="text-xs text-muted-foreground truncate block">
              {d.month.length > 3 ? d.month.slice(0, 3) : d.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const from = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const to = new Date().toISOString();

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-report'],
    queryFn: () => getRevenueReport(from, to),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      {/* Row 1: 4 operational stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Cases"
          value={stats?.activeCases}
          icon={FolderOpen}
          description="New + in progress"
          loading={isLoading}
          href="/cases?filter=active"
          delta={stats?.activeCasesDelta}
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueTasks}
          icon={AlertCircle}
          description="Past due date"
          loading={isLoading}
          href="/cases?filter=overdue"
        />
        <StatCard
          title="Cases This Month"
          value={stats?.casesThisMonth}
          icon={CalendarDays}
          description="Created in current month"
          loading={isLoading}
          href="/cases?filter=this-month"
          delta={stats?.casesLastMonthDelta}
        />
        <StatCard
          title="Pending Signatures"
          value={stats?.pendingSignatures}
          icon={FileSignature}
          description="Awaiting family signature"
          loading={isLoading}
          href="/cases?filter=pending-signatures"
        />
      </div>

      {/* Row 2: 2 revenue stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {revenueLoading ? (
          <>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue (YTD)"
              value={revenue?.totalRevenue}
              icon={DollarSign}
              description={
                revenue
                  ? `Avg ${formatCurrency(revenue.averageCaseValue)}/case`
                  : undefined
              }
              loading={false}
            />
            {/* Pending balance card — amber tint via wrapper */}
            <Card>
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Pending Balance</p>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-3xl font-semibold text-amber-600">
                  {revenue ? formatCurrency(revenue.pendingBalance) : '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Outstanding across all cases</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Row 3: Monthly bar chart + revenue by service type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cases by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : revenue && revenue.casesByMonth.length > 0 ? (
              <MonthlyBarChart data={revenue.casesByMonth} />
            ) : (
              <p className="text-sm text-muted-foreground">No data available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Service Type</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : revenue && revenue.revenueByServiceType.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Service Type</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Cases</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Revenue</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {revenue.revenueByServiceType.map((row) => (
                    <tr key={row.serviceType}>
                      <td className="py-2 capitalize">{row.serviceType}</td>
                      <td className="py-2 text-right">{row.count}</td>
                      <td className="py-2 text-right">{formatCurrency(row.revenue)}</td>
                      <td className="py-2 text-right text-muted-foreground">
                        {row.count > 0 ? formatCurrency(row.revenue / row.count) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent cases table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Cases</h2>
        <RecentCasesTable />
      </div>
    </div>
  );
}
