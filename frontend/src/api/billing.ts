import { apiClient } from "./client";
import type { InvoiceRead, PaymentMethodRead } from "./types";

export async function listPaymentMethods(): Promise<PaymentMethodRead[]> {
  const { data } = await apiClient.get("/payment-methods");
  return data;
}

export async function addPaymentMethod(payload: {
  card_number: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
  cardholder_name: string;
}): Promise<PaymentMethodRead> {
  const { data } = await apiClient.post("/payment-methods", payload);
  return data;
}

export async function removePaymentMethod(id: string): Promise<void> {
  await apiClient.delete(`/payment-methods/${id}`);
}

export async function listInvoices(): Promise<InvoiceRead[]> {
  const { data } = await apiClient.get("/invoices");
  return data;
}
