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

export async function createTemplate(payload: {
  name: string;
  description: string;
  field_definitions: FieldDefinition[];
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
