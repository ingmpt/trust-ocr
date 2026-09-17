import { apiClient } from "./client";
import type { ApiKeyCreated, ApiKeyRead, UserRead } from "./types";

export async function register(email: string, password: string, captchaToken: string): Promise<{ message: string; email: string }> {
  const { data } = await apiClient.post("/auth/register", { email, password, captcha_token: captchaToken });
  return data;
}

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post("/auth/verify-email", { token });
}

export async function login(email: string, password: string): Promise<string> {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data.access_token as string;
}

export async function getCurrentUser(): Promise<UserRead> {
  const { data } = await apiClient.get("/users/me");
  return data;
}

export async function changePassword(current_password: string, new_password: string): Promise<void> {
  await apiClient.put("/users/me/password", { current_password, new_password });
}

export async function changeEmail(new_email: string): Promise<void> {
  await apiClient.put("/users/me/email", { new_email });
}

export async function listApiKeys(): Promise<ApiKeyRead[]> {
  const { data } = await apiClient.get("/users/me/api-keys");
  return data;
}

export async function createApiKey(name: string): Promise<ApiKeyCreated> {
  const { data } = await apiClient.post("/users/me/api-keys", { name });
  return data;
}

export async function revokeApiKey(id: string): Promise<void> {
  await apiClient.delete(`/users/me/api-keys/${id}`);
}
