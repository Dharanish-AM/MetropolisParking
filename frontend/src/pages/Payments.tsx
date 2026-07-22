import { useState } from "react";
import type { FC } from "react";
import { Navbar } from "../components/Navbar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { usePayments, useProcessPayment } from "../features/payments/hooks";
import { DollarSign, CheckCircle2, AlertCircle, CreditCard, Landmark, Wallet, CircleDollarSign } from "lucide-react";

export const Payments: FC = () => {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: payments, isLoading, refetch } = usePayments();
  const processPaymentMutation = useProcessPayment();

  const handleSettleClick = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setPaymentMethod("CARD"); // Reset to default method
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId) return;

    processPaymentMutation.mutate(
      { paymentId: selectedPaymentId, method: paymentMethod },
      {
        onSuccess: () => {
          setSelectedPaymentId(null);
          setNotification({ message: "Payment processed successfully.", type: "success" });
          refetch();
        },
        onError: (err: any) => {
          setNotification({
            message: err.response?.data?.message || "Failed to process payment.",
            type: "error",
          });
        },
      }
    );
  };

  const getMethodIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case "CARD":
        return <CreditCard className="w-3.5 h-3.5 mr-1 inline" />;
      case "UPI":
        return <Landmark className="w-3.5 h-3.5 mr-1 inline" />;
      case "WALLET":
        return <Wallet className="w-3.5 h-3.5 mr-1 inline" />;
      default:
        return <CircleDollarSign className="w-3.5 h-3.5 mr-1 inline" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "AVAILABLE";
      case "PENDING":
        return "RESERVED";
      case "FAILED":
        return "OCCUPIED";
      default:
        return "neutral";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-primary flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Payments Ledger</h1>
          <p className="text-neutral-secondary text-sm font-medium mt-1">
            Track transactions, monitor settlement states, and process active billing sessions.
          </p>
        </div>

        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
              notification.type === "success"
                ? "bg-green-50 border-green-100 text-green-800"
                : "bg-red-50 border-red-100 text-red-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <div className="text-sm font-semibold">{notification.message}</div>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-xs font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

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
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : !payments || payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-neutral-secondary font-medium py-12">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="w-8 h-8 text-neutral-secondary stroke-[1.5]" />
                      <span>No payment transactions logged in the system.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs text-neutral-secondary select-all">
                      {payment.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-neutral-secondary">
                      {payment.sessionId}
                    </TableCell>
                    <TableCell className="font-bold text-neutral-primary">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {payment.method ? (
                        <span className="flex items-center">
                          {getMethodIcon(payment.method)}
                          {payment.method}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.status.toUpperCase() === "PENDING" ? (
                        <Button
                          variant="primary"
                          onClick={() => handleSettleClick(payment.id)}
                          className="px-3.5 py-1.5 text-xs font-bold"
                        >
                          Settle Invoice
                        </Button>
                      ) : (
                        <span className="text-xs text-neutral-secondary font-semibold pr-3">Setted</span>
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
              onChange={(e) => setPaymentMethod(e.target.value)}
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
                isLoading={processPaymentMutation.status === "pending"}
                className="w-auto px-5"
              >
                Confirm Payment
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};
