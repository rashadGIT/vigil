import { apiClient } from './client';
import type { IPayment } from '@vigil/shared-types';

export interface PaymentSummary {
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
}

export async function getCasePayments(caseId: string): Promise<{ payments: IPayment[]; summary: PaymentSummary }> {
  const res = await apiClient.get<{ payments: IPayment[]; summary: PaymentSummary }>(`/cases/${caseId}/payments`);
  return res.data;
}

export async function recordPayment(caseId: string, dto: { amount: number; method: string; notes?: string }): Promise<IPayment> {
  const res = await apiClient.post<IPayment>('/payments', { caseId, ...dto });
  return res.data;
}
