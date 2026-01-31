import { Router, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all companies
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, search } = req.query;
    
    let sql = `
      SELECT c.*,
        (SELECT COUNT(*) FROM transcripts WHERE company_id = c.id) as transcript_count,
        (SELECT COUNT(*) FROM emails WHERE company_id = c.id) as email_count,
        (SELECT COUNT(*) FROM documents WHERE company_id = c.id) as document_count
      FROM companies c
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (type) {
      params.push(type);
      sql += ` AND c.type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND c.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
    }

    sql += ' ORDER BY c.created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single company with all related data
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get company
    const companyResult = await query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM transcripts WHERE company_id = c.id) as transcript_count,
        (SELECT COUNT(*) FROM emails WHERE company_id = c.id) as email_count,
        (SELECT COUNT(*) FROM documents WHERE company_id = c.id) as document_count
      FROM companies c WHERE c.id = $1`,
      [id]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = companyResult.rows[0];

    // Get transcripts
    const transcriptsResult = await query(
      `SELECT id, title, meeting_date, duration_minutes, participants, summary, key_points, created_at 
       FROM transcripts WHERE company_id = $1 ORDER BY meeting_date DESC`,
      [id]
    );

    // Get emails
    const emailsResult = await query(
      `SELECT id, subject, from_address, to_addresses, sent_date, has_attachments, created_at 
       FROM emails WHERE company_id = $1 ORDER BY sent_date DESC`,
      [id]
    );

    // Get documents
    const documentsResult = await query(
      `SELECT id, title, type, file_size, mime_type, created_at 
       FROM documents WHERE company_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    // Get tags
    const tagsResult = await query(
      `SELECT t.* FROM tags t 
       JOIN company_tags ct ON t.id = ct.tag_id 
       WHERE ct.company_id = $1`,
      [id]
    );

    res.json({
      ...company,
      transcripts: transcriptsResult.rows,
      emails: emailsResult.rows,
      documents: documentsResult.rows,
      tags: tagsResult.rows
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create company (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, type, logo_url, website, industry, employee_count, description,
      status, primary_contact_name, primary_contact_email, primary_contact_title,
      contract_value, contract_start_date, contract_end_date, notes
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const result = await query(
      `INSERT INTO companies (
        name, type, logo_url, website, industry, employee_count, description,
        status, primary_contact_name, primary_contact_email, primary_contact_title,
        contract_value, contract_start_date, contract_end_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        name, type, logo_url, website, industry, employee_count, description,
        status || 'active', primary_contact_name, primary_contact_email, primary_contact_title,
        contract_value, contract_start_date, contract_end_date, notes
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update company (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, type, logo_url, website, industry, employee_count, description,
      status, primary_contact_name, primary_contact_email, primary_contact_title,
      contract_value, contract_start_date, contract_end_date, notes
    } = req.body;

    const result = await query(
      `UPDATE companies SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        logo_url = COALESCE($3, logo_url),
        website = COALESCE($4, website),
        industry = COALESCE($5, industry),
        employee_count = COALESCE($6, employee_count),
        description = COALESCE($7, description),
        status = COALESCE($8, status),
        primary_contact_name = COALESCE($9, primary_contact_name),
        primary_contact_email = COALESCE($10, primary_contact_email),
        primary_contact_title = COALESCE($11, primary_contact_title),
        contract_value = COALESCE($12, contract_value),
        contract_start_date = COALESCE($13, contract_start_date),
        contract_end_date = COALESCE($14, contract_end_date),
        notes = COALESCE($15, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *`,
      [
        name, type, logo_url, website, industry, employee_count, description,
        status, primary_contact_name, primary_contact_email, primary_contact_title,
        contract_value, contract_start_date, contract_end_date, notes, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete company (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM companies WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
