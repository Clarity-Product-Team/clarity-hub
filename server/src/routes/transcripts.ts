import { Router, Response } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all transcripts for a company
router.get('/company/:companyId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    
    const result = await query(
      `SELECT * FROM transcripts WHERE company_id = $1 ORDER BY meeting_date DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get transcripts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single transcript
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM transcripts WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create transcript (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      company_id, title, meeting_date, duration_minutes, participants,
      content, summary, key_points, video_url
    } = req.body;

    if (!company_id || !title || !meeting_date || !content) {
      return res.status(400).json({ error: 'company_id, title, meeting_date, and content are required' });
    }

    const result = await query(
      `INSERT INTO transcripts (
        company_id, title, meeting_date, duration_minutes, participants,
        content, summary, key_points, video_url, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        company_id, title, meeting_date, duration_minutes, participants,
        content, summary, key_points, video_url, req.user!.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create transcript error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update transcript (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title, meeting_date, duration_minutes, participants,
      content, summary, key_points, video_url
    } = req.body;

    const result = await query(
      `UPDATE transcripts SET
        title = COALESCE($1, title),
        meeting_date = COALESCE($2, meeting_date),
        duration_minutes = COALESCE($3, duration_minutes),
        participants = COALESCE($4, participants),
        content = COALESCE($5, content),
        summary = COALESCE($6, summary),
        key_points = COALESCE($7, key_points),
        video_url = COALESCE($8, video_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [title, meeting_date, duration_minutes, participants, content, summary, key_points, video_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update transcript error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transcript (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM transcripts WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    res.json({ message: 'Transcript deleted successfully' });
  } catch (error) {
    console.error('Delete transcript error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
