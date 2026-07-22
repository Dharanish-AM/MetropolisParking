import { client } from "../client";

export interface Payment {
  id: string;
  sessionId: string;
  amount: number;
  method: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | string;
}

export const getPayments = async (): Promise<Payment[]> => {
  const res = await client.get("/payments");
  return res.data;
};

export const processPayment = async (
  paymentId: string,
  payload: { method: string }
): Promise<Payment> => {
  const res = await client.post(`/payments/${paymentId}`, payload);
  return res.data;
};
