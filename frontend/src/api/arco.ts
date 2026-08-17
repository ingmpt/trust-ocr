import axios from "axios";
import type { ArcoRequestRead } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

// El Portal ARCO es público (HU 3.2): no requiere sesión ni clave API.
const arcoClient = axios.create({ baseURL: API_BASE_URL });

export async function verifyIdentity(dni: string, identityPhoto: File): Promise<{ validation_token: string; dni: string }> {
  const formData = new FormData();
  formData.append("dni", dni);
  formData.append("identity_photo", identityPhoto);
  const { data } = await arcoClient.post("/arco/identity/verify", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function requestAccess(validation_token: string): Promise<ArcoRequestRead> {
  const { data } = await arcoClient.post("/arco/requests/access", { validation_token });
  return data;
}

export async function requestRectification(
  validation_token: string,
  fields_to_rectify: Record<string, string>,
  reason: string
): Promise<ArcoRequestRead> {
  const { data } = await arcoClient.post("/arco/requests/rectification", { validation_token, fields_to_rectify, reason });
  return data;
}

export async function requestCancellation(validation_token: string, reason: string, confirm: boolean): Promise<ArcoRequestRead> {
  const { data } = await arcoClient.post("/arco/requests/cancellation", { validation_token, reason, confirm });
  return data;
}

export async function requestOpposition(validation_token: string, reason: string): Promise<ArcoRequestRead> {
  const { data } = await arcoClient.post("/arco/requests/opposition", { validation_token, reason });
  return data;
}

export async function trackRequests(dni: string): Promise<ArcoRequestRead[]> {
  const { data } = await arcoClient.get(`/arco/requests/track/${dni}`);
  return data;
}
