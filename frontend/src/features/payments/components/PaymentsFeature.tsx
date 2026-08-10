import { useState } from 'react';
import type { FC } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { usePayments, useProcessPayment } from '../hooks';
import { useToast } from '../../../context/ToastContext';
import { DollarSign, CreditCard, Landmark, Wallet, CircleDollarSign } from 'lucide-react';

export const PaymentsFeature: FC = () => {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const { showToast } = useToast();

  const { data: payments, isLoading, refetch } = usePayments();
  const processPaymentMutation = useProcessPayment();

  const handleSettleClick = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setPaymentMethod('CARD');
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId) return;

    processPaymentMutation.mutate(
      { paymentId: selectedPaymentId, method: paymentMethod },
      {
        onSuccess: () => {
          setSelectedPaymentId(null);
          showToast('Payment processed successfully.', 'success');
          refetch();
        },
        onError: (err: any) => {
          showToast(err.response?.data?.message || 'Failed to process payment.', 'error');
        },
      }
    );
  };

  const getMethodIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case 'CARD':
        return <CreditCard className="w-3.5 h-3.5 mr-1 inline" />;
      case 'UPI':
        return <Landmark className="w-3.5 h-3.5 mr-1 inline" />;
      case 'WALLET':
        return <Wallet className="w-3.5 h-3.5 mr-1 inline" />;
      default:
        return <CircleDollarSign className="w-3.5 h-3.5 mr-1 inline" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
        return 'AVAILABLE';
      case 'PENDING':
        return 'RESERVED';
      case 'FAILED':
        return 'OCCUPIED';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-primary">
          Payments Ledger
        </h1>
        <p className="text-neutral-secondary text-sm font-medium mt-1">
          Track transactions, monitor settlement states, and process active billing sessions.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Session ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : !payments || payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-4 border-0">
                  <EmptyState
                    icon={DollarSign}
                    title="No payment transactions"
                    description="No payment transactions or invoice settlements recorded in the ledger."
                  />
                </TableCell>
              </TableRow>
            ) : (
              payments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell
                    className="font-mono text-xs font-bold text-neutral-primary select-all"
                    title={payment.id}
                  >
                    #{payment.id.slice(0, 8)}
                  </TableCell>
                  <TableCell
                    className="font-mono text-xs text-neutral-secondary select-all"
                    title={payment.sessionId}
                  >
                    #{payment.sessionId.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-bold text-neutral-primary">
                    ₹{payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    {payment.method && payment.method.toUpperCase() !== 'PENDING' ? (
                      <span className="flex items-center">
                        {getMethodIcon(payment.method)}
                        {payment.method}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-secondary font-medium italic">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status.toUpperCase() === 'PENDING' ? (
                      <Button
                        variant="primary"
                        onClick={() => handleSettleClick(payment.id)}
                        className="px-3.5 py-1.5 text-xs font-bold"
                      >
                        Settle Invoice
                      </Button>
                    ) : (
                      <span className="text-xs text-status-available font-bold pr-3">Settled</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal
        isOpen={selectedPaymentId !== null}
        onClose={() => setSelectedPaymentId(null)}
        title="Process Invoice Settlement"
      >
        <form onSubmit={handleProcessSubmit} className="space-y-4">
          <Select
            label="Select Settlement Method"
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
          >
            <option value="CARD">Credit / Debit Card</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI Payment</option>
            <option value="WALLET">Mobile Wallet</option>
          </Select>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedPaymentId(null)}
              className="w-auto px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={processPaymentMutation.status === 'pending'}
              className="w-auto px-5"
            >
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
