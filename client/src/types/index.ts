export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  created_at: string;
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
  contract_start_date?: string;
  contract_end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  transcript_count?: number;
  email_count?: number;
  document_count?: number;
  tags?: Tag[];
}

export interface CompanyWithDetails extends Company {
  transcripts: Transcript[];
  emails: Email[];
  documents: Document[];
}

export interface Transcript {
  id: string;
  company_id: string;
  title: string;
  meeting_date: string;
  duration_minutes?: number;
  participants?: string[];
  content: string;
  summary?: string;
  key_points?: string[];
  video_url?: string;
  created_at: string;
}

export interface Email {
  id: string;
  company_id: string;
  subject: string;
  from_address: string;
  to_addresses: string[];
  cc_addresses?: string[];
  sent_date: string;
  body: string;
  thread_id?: string;
  has_attachments: boolean;
  attachment_names?: string[];
  created_at: string;
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
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  company_id: string;
  user_id: string;
  user_name?: string;
  question: string;
  answer: string;
  sources?: Source[];
  created_at: string;
}

export interface Source {
  type: 'transcript' | 'email' | 'document';
  id: string;
  title: string;
  excerpt: string;
}

export interface AIResponse {
  answer: string;
  sources: Source[];
}
