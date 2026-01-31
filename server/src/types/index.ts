export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'employee';
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  name: string;
  type: 'customer' | 'prospect';
  logo_url?: string;
  website?: string;
  industry?: string;
  employee_count?: string;
  description?: string;
  status: 'active' | 'inactive' | 'churned' | 'lost';
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_title?: string;
  contract_value?: number;
  contract_start_date?: Date;
  contract_end_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  company_id: string;
  title: string;
  type: 'contract' | 'proposal' | 'presentation' | 'report' | 'other';
  file_path?: string;
  file_url?: string;
  content?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Transcript {
  id: string;
  company_id: string;
  title: string;
  meeting_date: Date;
  duration_minutes?: number;
  participants?: string[];
  content: string;
  summary?: string;
  key_points?: string[];
  video_url?: string;
  uploaded_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Email {
  id: string;
  company_id: string;
  subject: string;
  from_address: string;
  to_addresses: string[];
  cc_addresses?: string[];
  sent_date: Date;
  body: string;
  thread_id?: string;
  has_attachments: boolean;
  attachment_names?: string[];
  uploaded_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatHistory {
  id: string;
  company_id: string;
  user_id: string;
  question: string;
  answer: string;
  sources?: {
    type: 'transcript' | 'email' | 'document';
    id: string;
    title: string;
    excerpt: string;
  }[];
  created_at: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: Date;
}

export interface CompanyWithStats extends Company {
  transcript_count?: number;
  email_count?: number;
  document_count?: number;
  tags?: Tag[];
}

export interface AIQueryRequest {
  company_id: string;
  question: string;
}

export interface AIQueryResponse {
  answer: string;
  sources: {
    type: 'transcript' | 'email' | 'document';
    id: string;
    title: string;
    excerpt: string;
  }[];
}
