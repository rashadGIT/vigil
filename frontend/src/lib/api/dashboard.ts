import { apiClient } from './client';

export interface DashboardStats {
  activeCases: number;
  overdueTasks: number;
  casesThisMonth: number;
  pendingSignatures: number;
}

export interface RecentCase {
  id: string;
  deceasedFirstName: string;
  deceasedLastName: string;
  status: string;
  assignedTo: string | null;
  updatedAt: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<DashboardStats>('/dashboard/stats');
  return res.data;
}

export async function getRecentCases(): Promise<RecentCase[]> {
  const res = await apiClient.get<RecentCase[]>('/cases', {
    params: { limit: 5, sort: 'updatedAt', order: 'desc' },
  });
  return res.data;
}
