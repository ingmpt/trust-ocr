import { apiClient } from "./client";

export interface BatchSubmitResponse {
  batch_id: string;
  status: string;
  total_files: number;
  message: string;
}

export interface BatchStatusRead {
  id: string;
  status: string;
  processing_mode: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  created_at: string;
  completed_at: string | null;
}

export interface BatchDocumentRead {
  id: string;
  original_filename: string;
  status: string;
  document_type: string | null;
  page_count: number;
}

export async function submitBatch(
  zipFile: File,
  processingMode: "express" | "almacenado",
  templateId?: string
): Promise<BatchSubmitResponse> {
  const formData = new FormData();
  formData.append("file", zipFile);
  formData.append("processing_mode", processingMode);
  if (templateId) formData.append("template_id", templateId);
  const { data } = await apiClient.post("/batches", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listBatches(limit = 20): Promise<BatchStatusRead[]> {
  const { data } = await apiClient.get("/batches", { params: { limit } });
  return data;
}

export async function getBatchStatus(batchId: string): Promise<BatchStatusRead> {
  const { data } = await apiClient.get(`/batches/${batchId}`);
  return data;
}

export async function listBatchDocuments(batchId: string): Promise<BatchDocumentRead[]> {
  const { data } = await apiClient.get(`/batches/${batchId}/documents`);
  return data;
}
