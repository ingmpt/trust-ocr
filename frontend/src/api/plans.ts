import { apiClient } from "./client";
import type { PlanRead, SubscriptionRead } from "./types";

export async function listPlans(): Promise<PlanRead[]> {
  const { data } = await apiClient.get("/plans");
  return data;
}

export async function getMySubscription(): Promise<SubscriptionRead> {
  const { data } = await apiClient.get("/subscriptions/me");
  return data;
}

export async function upgradePlan(plan_code: string): Promise<SubscriptionRead> {
  const { data } = await apiClient.post("/subscriptions/me/upgrade", { plan_code });
  return data;
}
