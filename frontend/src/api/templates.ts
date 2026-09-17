import { apiClient } from "./client";

export interface FieldDefinition {
  name: string;
  label: string;
}

export interface TemplateRead {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  field_definitions: FieldDefinition[];
  is_active: boolean;
  is_draft: boolean;
  created_at: string;
}

export interface ExtractedFieldPreview {
  name: string;
  label: string;
  value: string | number | null;
  confidence: number;
}

export async function listTemplates(): Promise<TemplateRead[]> {
  const { data } = await apiClient.get("/templates");
  return data;
}

export async function getTemplate(id: string): Promise<TemplateRead> {
  const { data } = await apiClient.get(`/templates/${id}`);
  return data;
}

export async function createTemplate(payload: {
  name: string;
  description: string;
  field_definitions: FieldDefinition[];
  make_global?: boolean;
}): Promise<TemplateRead> {
  const { data } = await apiClient.post("/templates", payload);
  return data;
}

export async function updateTemplate(
  id: string,
  payload: { name?: string; description?: string; field_definitions?: FieldDefinition[] }
): Promise<TemplateRead> {
  const { data } = await apiClient.put(`/templates/${id}`, payload);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/templates/${id}`);
}

export async function previewExtraction(file: File): Promise<ExtractedFieldPreview[]> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post("/templates/preview-extraction", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// --- Administración de plantillas (HU 4.2) ---

export async function listDraftTemplates(): Promise<TemplateRead[]> {
  const { data } = await apiClient.get("/admin/templates/drafts");
  return data;
}

export async function approveDraftTemplate(
  id: string,
  payload: { name?: string; description?: string; field_definitions?: FieldDefinition[]; make_global?: boolean }
): Promise<TemplateRead> {
  const { data } = await apiClient.post(`/admin/templates/drafts/${id}/approve`, payload);
  return data;
}

export async function rejectDraftTemplate(id: string): Promise<void> {
  await apiClient.delete(`/admin/templates/drafts/${id}`);
}

export async function setTemplateActive(id: string, is_active: boolean): Promise<TemplateRead> {
  const { data } = await apiClient.patch(`/admin/templates/${id}/active`, { is_active });
  return data;
}

export async function promoteTemplateToGlobal(id: string): Promise<TemplateRead> {
  const { data } = await apiClient.patch(`/admin/templates/${id}/promote-global`, {});
  return data;
}
