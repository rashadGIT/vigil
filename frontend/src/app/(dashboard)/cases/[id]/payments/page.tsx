'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { getCasePayments, recordPayment } from '@/lib/api/payments';
import { formatDate } from '@/lib/utils/format-date';

function PaymentList({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['payments', caseId],
    queryFn: () => getCasePayments(caseId),
  });

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');

  const mutation = useMutation({
    mutationFn: () => recordPayment(caseId, { amount: parseFloat(amount), method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', caseId] });
      toast.success('Payment recorded.');
      setOpen(false);
      setAmount('');
      setMethod('');
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const { payments = [], summary } = data || { payments: [], summary: { totalAmount: 0, amountPaid: 0, outstanding: 0 } };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">${summary.totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-lg font-semibold text-green-600">${summary.amountPaid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-lg font-semibold text-amber-600">${summary.outstanding.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Payment History</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Record Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Method</Label>
                <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Cash, Check, Card..." />
              </div>
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !amount || !method}>
                {mutation.isPending ? 'Recording...' : 'Record'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <div className="rounded-md border divide-y">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">${p.amountPaid.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{p.method} &middot; {formatDate(p.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CasePaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <PaymentList caseId={id} />
    </div>
  );
}
