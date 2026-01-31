import { Router, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all emails for a company
router.get('/company/:companyId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    
    const result = await query(
      `SELECT * FROM emails WHERE company_id = $1 ORDER BY sent_date DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single email
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM emails WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create email (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      company_id, subject, from_address, to_addresses, cc_addresses,
      sent_date, body, thread_id, has_attachments, attachment_names
    } = req.body;

    if (!company_id || !subject || !from_address || !to_addresses || !sent_date || !body) {
      return res.status(400).json({ 
        error: 'company_id, subject, from_address, to_addresses, sent_date, and body are required' 
      });
    }

    const result = await query(
      `INSERT INTO emails (
        company_id, subject, from_address, to_addresses, cc_addresses,
        sent_date, body, thread_id, has_attachments, attachment_names, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        company_id, subject, from_address, to_addresses, cc_addresses,
        sent_date, body, thread_id, has_attachments || false, attachment_names, req.user!.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update email (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      subject, from_address, to_addresses, cc_addresses,
      sent_date, body, thread_id, has_attachments, attachment_names
    } = req.body;

    const result = await query(
      `UPDATE emails SET
        subject = COALESCE($1, subject),
        from_address = COALESCE($2, from_address),
        to_addresses = COALESCE($3, to_addresses),
        cc_addresses = COALESCE($4, cc_addresses),
        sent_date = COALESCE($5, sent_date),
        body = COALESCE($6, body),
        thread_id = COALESCE($7, thread_id),
        has_attachments = COALESCE($8, has_attachments),
        attachment_names = COALESCE($9, attachment_names),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *`,
      [subject, from_address, to_addresses, cc_addresses, sent_date, body, thread_id, has_attachments, attachment_names, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete email (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM emails WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
