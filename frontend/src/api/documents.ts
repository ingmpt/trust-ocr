import { apiClient } from "./client";
import type { DocumentResultRead, DocumentUploadResponse } from "./types";

export async function uploadDocument(file: File, processingMode: "express" | "almacenado"): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("processing_mode", processingMode);
  const { data } = await apiClient.post("/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function uploadBatch(zipFile: File, processingMode: "express" | "almacenado") {
  const formData = new FormData();
  formData.append("file", zipFile);
  formData.append("processing_mode", processingMode);
  const { data } = await apiClient.post("/documents/batch", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as { batch_id: string; document_ids: string[]; total_documents: number; estimated_seconds: number };
}

export async function getDocumentResult(documentId: string): Promise<DocumentResultRead> {
  const { data } = await apiClient.get(`/documents/${documentId}`);
  return data;
}

export async function listRecentDocuments(limit = 10): Promise<DocumentResultRead[]> {
  const { data } = await apiClient.get("/documents/recent", { params: { limit } });
  return data;
}
