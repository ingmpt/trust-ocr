export interface UserRead {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface PlanRead {
  id: string;
  code: string;
  name: string;
  monthly_price_pen: number;
  included_pages: number;
  overage_price_per_page_pen: number;
}

export interface SubscriptionRead {
  id: string;
  plan: PlanRead;
  status: string;
  current_period_start: string;
  current_period_end: string;
  pages_used: number;
  pages_remaining: number;
  usage_percent: number;
}

export interface ExtractedField {
  value: string | number | null;
  confidence: number;
}

export interface DocumentUploadResponse {
  id: string;
  status: string;
  processing_mode: string;
  page_count: number;
  estimated_seconds: number;
}

export interface DocumentResultRead {
  id: string;
  status: string;
  processing_mode: string;
  document_type: string | null;
  extracted_fields: Record<string, ExtractedField> | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export interface ApiKeyRead {
  id: string;
  name: string;
  key_preview: string;
  created_at: string;
  revoked_at: string | null;
}

export interface ApiKeyCreated {
  id: string;
  name: string;
  raw_key: string;
  created_at: string;
}

export interface PaymentMethodRead {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export interface InvoiceRead {
  id: string;
  amount_pen: number;
  status: string;
  period_start: string;
  period_end: string;
  pdf_url: string | null;
  created_at: string;
}

export interface ArcoRequestRead {
  id: string;
  dni: string;
  right_type: string;
  status: string;
  validation_token: string;
  report_url: string | null;
  requested_at: string;
  resolved_at: string | null;
}
