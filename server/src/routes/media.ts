import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../db/index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure upload directory
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept common file types
    const allowedMimes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'text/markdown',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      // Video
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      // Archives (for transcripts)
      'application/json',
    ];
    
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported`));
    }
  }
});

// Determine file type category
function getFileType(mimeType: string): string {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/') || 
      mimeType.includes('document') || 
      mimeType.includes('sheet')) return 'document';
  return 'other';
}

// Extract text from file (basic implementation)
async function extractTextFromFile(filePath: string, mimeType: string): Promise<string | null> {
  try {
    // For text files, read directly
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content;
    }
    
    // For Word documents, use mammoth to extract text
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        mimeType === 'application/msword') {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value || null;
      } catch (e) {
        console.error('Docx extraction error:', e);
        return null;
      }
    }
    
    // For PDFs, we'll store a placeholder - in production, you'd use pdf-parse
    if (mimeType === 'application/pdf') {
      // Note: To fully extract PDF text, install pdf-parse package
      // For now, return null and let Gemini process the file directly
      return null;
    }
    
    // For images, return null - Gemini vision will process them
    if (mimeType.startsWith('image/')) {
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('Text extraction error:', error);
    return null;
  }
}

// Upload a media file
router.post('/upload/:companyId', authenticate, requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    const { title, description, fileType: requestedFileType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify company exists
    const companyResult = await query('SELECT id FROM companies WHERE id = $1', [companyId]);
    if (companyResult.rows.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Company not found' });
    }

    // Use requested file type if provided, otherwise detect from mime type
    const fileType = requestedFileType || getFileType(file.mimetype);
    const extractedText = await extractTextFromFile(file.path, file.mimetype);

    // Insert into database - all files are considered "completed" once uploaded
    // PDFs, images, and videos don't need text extraction to be usable
    const result = await query(
      `INSERT INTO media_files 
        (company_id, title, description, file_type, original_filename, stored_filename, 
         file_path, file_size, mime_type, extracted_text, processing_status, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        companyId,
        title || file.originalname,
        description || null,
        fileType,
        file.originalname,
        file.filename,
        file.path,
        file.size,
        file.mimetype,
        extractedText,
        'completed', // Files are ready immediately after upload
        req.user!.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Upload error:', error);
    // Clean up file if database insert failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

// Upload with pasted text content
router.post('/paste/:companyId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    const { title, description, content, contentType } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Verify company exists
    const companyResult = await query('SELECT id FROM companies WHERE id = $1', [companyId]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create a text file from pasted content
    const filename = `pasted-${Date.now()}.txt`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, content);

    const fileType = contentType || 'transcript';
    const fileSize = Buffer.byteLength(content, 'utf-8');

    // Insert into database
    const result = await query(
      `INSERT INTO media_files 
        (company_id, title, description, file_type, original_filename, stored_filename, 
         file_path, file_size, mime_type, extracted_text, processing_status, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        companyId,
        title || 'Pasted Content',
        description || null,
        fileType,
        `${title || 'pasted-content'}.txt`,
        filename,
        filePath,
        fileSize,
        'text/plain',
        content,
        'completed',
        req.user!.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Paste content error:', error);
    res.status(500).json({ error: error.message || 'Failed to save content' });
  }
});

// Get all media files for a company
router.get('/company/:companyId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;

    const result = await query(
      `SELECT mf.*, u.name as uploaded_by_name 
       FROM media_files mf 
       LEFT JOIN users u ON mf.uploaded_by = u.id
       WHERE mf.company_id = $1 
       ORDER BY mf.created_at DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get media files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single media file
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT mf.*, u.name as uploaded_by_name 
       FROM media_files mf 
       LEFT JOIN users u ON mf.uploaded_by = u.id
       WHERE mf.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get media file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download/serve a media file
router.get('/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT file_path, original_filename, mime_type FROM media_files WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    const { file_path, original_filename, mime_type } = result.rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set headers for inline viewing
    res.setHeader('Content-Type', mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${original_filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // For PDFs, also set specific headers to help browser rendering
    if (mime_type === 'application/pdf') {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    
    const fileStream = fs.createReadStream(file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update media file metadata
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, extracted_text } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (extracted_text !== undefined) {
      updates.push(`extracted_text = $${paramCount++}`);
      values.push(extracted_text);
      updates.push(`processing_status = 'completed'`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE media_files SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update media file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a media file
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get file info first
    const fileResult = await query('SELECT file_path FROM media_files WHERE id = $1', [id]);
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    const { file_path } = fileResult.rows[0];

    // Delete from database
    await query('DELETE FROM media_files WHERE id = $1', [id]);

    // Delete file from disk
    if (fs.existsSync(file_path)) {
      fs.unlinkSync(file_path);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete media file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Re-extract text from a media file
router.post('/:id/extract', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT file_path, mime_type FROM media_files WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    const { file_path, mime_type } = result.rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    const extractedText = await extractTextFromFile(file_path, mime_type);

    await query(
      'UPDATE media_files SET extracted_text = $1 WHERE id = $2',
      [extractedText, id]
    );

    res.json({ success: true, hasText: !!extractedText });
  } catch (error) {
    console.error('Extract text error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analyze file content and suggest type
router.post('/analyze', authenticate, requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Extract text from the file
    const extractedText = await extractTextFromFile(file.path, file.mimetype);
    
    // Clean up the temp file
    fs.unlinkSync(file.path);

    if (!extractedText || extractedText.length < 50) {
      // Not enough text to analyze
      return res.json({ 
        suggestedType: 'document',
        confidence: 'low',
        reason: 'Not enough text content to analyze'
      });
    }

    // Use AI to analyze the content
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ 
        suggestedType: 'document',
        confidence: 'low',
        reason: 'AI analysis not available'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

    const prompt = `Analyze this document content and determine what type it is. Respond with ONLY a JSON object (no markdown, no code blocks) with these fields:
- type: one of "transcript", "email", "document_internal", "document_external", "proposal", "contract", "report", "notes"
- confidence: "high", "medium", or "low"
- reason: brief explanation (1-2 sentences)
- suggestedTitle: a good title for this document based on content

Content types explained:
- transcript: Meeting notes, call transcripts, conversation records with multiple speakers
- email: Email correspondence, email threads
- document_internal: Documents written by our company (Clarity)
- document_external: Documents from a client or partner company
- proposal: Sales proposals, project proposals
- contract: Legal agreements, terms of service
- report: Analysis reports, status reports
- notes: General notes, summaries

Here is the document content (first 3000 chars):
${extractedText.substring(0, 3000)}`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Parse the JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return res.json({
          suggestedType: analysis.type || 'document',
          confidence: analysis.confidence || 'medium',
          reason: analysis.reason || 'Based on content analysis',
          suggestedTitle: analysis.suggestedTitle || file.originalname.replace(/\.[^/.]+$/, '')
        });
      }
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
    }

    // Fallback: basic heuristic analysis
    const textLower = extractedText.toLowerCase();
    let suggestedType = 'document';
    let reason = 'Based on file content';

    if (textLower.includes('meeting') || textLower.includes('transcript') || 
        textLower.includes('speaker:') || textLower.includes('[speaker') ||
        /^\s*\[?\d{1,2}:\d{2}/.test(extractedText)) {
      suggestedType = 'transcript';
      reason = 'Contains meeting/transcript indicators';
    } else if (textLower.includes('from:') && textLower.includes('to:') && textLower.includes('subject:')) {
      suggestedType = 'email';
      reason = 'Contains email headers';
    } else if (textLower.includes('proposal') || textLower.includes('we propose')) {
      suggestedType = 'proposal';
      reason = 'Contains proposal language';
    } else if (textLower.includes('agreement') || textLower.includes('terms and conditions')) {
      suggestedType = 'contract';
      reason = 'Contains contract/agreement language';
    }

    res.json({
      suggestedType,
      confidence: 'medium',
      reason,
      suggestedTitle: file.originalname.replace(/\.[^/.]+$/, '')
    });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze file' });
  }
});

export default router;
