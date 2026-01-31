import { Router, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all documents for a company
router.get('/company/:companyId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    
    const result = await query(
      `SELECT * FROM documents WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single document
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM documents WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create document (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      company_id, title, type, file_path, file_url, content, file_size, mime_type
    } = req.body;

    if (!company_id || !title || !type) {
      return res.status(400).json({ error: 'company_id, title, and type are required' });
    }

    const result = await query(
      `INSERT INTO documents (
        company_id, title, type, file_path, file_url, content, file_size, mime_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [company_id, title, type, file_path, file_url, content, file_size, mime_type, req.user!.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update document (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, file_path, file_url, content, file_size, mime_type } = req.body;

    const result = await query(
      `UPDATE documents SET
        title = COALESCE($1, title),
        type = COALESCE($2, type),
        file_path = COALESCE($3, file_path),
        file_url = COALESCE($4, file_url),
        content = COALESCE($5, content),
        file_size = COALESCE($6, file_size),
        mime_type = COALESCE($7, mime_type),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [title, type, file_path, file_url, content, file_size, mime_type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete document (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM documents WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
