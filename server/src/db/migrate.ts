import { query } from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const migrations = `
-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table (customers and prospects)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('customer', 'prospect')),
  logo_url VARCHAR(500),
  website VARCHAR(500),
  industry VARCHAR(255),
  employee_count VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'churned', 'lost')),
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_title VARCHAR(255),
  contract_value DECIMAL(15, 2),
  contract_start_date DATE,
  contract_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table (general documents, proposals, contracts)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL CHECK (type IN ('contract', 'proposal', 'presentation', 'report', 'other')),
  file_path VARCHAR(500),
  file_url VARCHAR(500),
  content TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meeting transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  meeting_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER,
  participants TEXT[],
  content TEXT NOT NULL,
  summary TEXT,
  key_points TEXT[],
  video_url VARCHAR(500),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email exchanges table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subject VARCHAR(500) NOT NULL,
  from_address VARCHAR(255) NOT NULL,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  sent_date TIMESTAMP NOT NULL,
  body TEXT NOT NULL,
  thread_id VARCHAR(255),
  has_attachments BOOLEAN DEFAULT FALSE,
  attachment_names TEXT[],
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Chat history for reference
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags for organizing content
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company tags junction table
CREATE TABLE IF NOT EXISTS company_tags (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_company_id ON transcripts(company_id);
CREATE INDEX IF NOT EXISTS idx_emails_company_id ON emails(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_company_id ON chat_history(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_transcripts_content_search ON transcripts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_emails_body_search ON emails USING gin(to_tsvector('english', body));
CREATE INDEX IF NOT EXISTS idx_documents_content_search ON documents USING gin(to_tsvector('english', COALESCE(content, '')));
`;

async function migrate() {
  console.log('🚀 Running database migrations...');
  
  try {
    await query(migrations);
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrate();
