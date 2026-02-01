import { Router, Response } from 'express';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { query } from '../db/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// Initialize Gemini
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
};

// Ask a question about a company
router.post('/ask', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { company_id, question } = req.body;

    if (!company_id || !question) {
      return res.status(400).json({ error: 'company_id and question are required' });
    }

    // Get company info
    const companyResult = await query('SELECT * FROM companies WHERE id = $1', [company_id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const company = companyResult.rows[0];

    // Get all transcripts
    const transcriptsResult = await query(
      'SELECT id, title, meeting_date, content, summary, key_points FROM transcripts WHERE company_id = $1',
      [company_id]
    );

    // Get all emails
    const emailsResult = await query(
      'SELECT id, subject, from_address, to_addresses, sent_date, body FROM emails WHERE company_id = $1',
      [company_id]
    );

    // Get all documents
    const documentsResult = await query(
      'SELECT id, title, type, content FROM documents WHERE company_id = $1',
      [company_id]
    );

    // Get all media files with extracted text
    const mediaFilesResult = await query(
      `SELECT id, title, description, file_type, original_filename, file_path, 
              mime_type, extracted_text, metadata 
       FROM media_files 
       WHERE company_id = $1 AND processing_status = 'completed'`,
      [company_id]
    );

    // Build context for AI
    let context = `# Company Information: ${company.name}\n`;
    context += `Type: ${company.type}\n`;
    context += `Industry: ${company.industry || 'N/A'}\n`;
    context += `Status: ${company.status}\n`;
    context += `Description: ${company.description || 'N/A'}\n`;
    context += `Primary Contact: ${company.primary_contact_name || 'N/A'} (${company.primary_contact_email || 'N/A'})\n`;
    if (company.contract_value) {
      context += `Contract Value: $${company.contract_value}\n`;
    }
    context += `Notes: ${company.notes || 'N/A'}\n\n`;

    // Add transcripts
    if (transcriptsResult.rows.length > 0) {
      context += '# Meeting Transcripts\n\n';
      for (const transcript of transcriptsResult.rows) {
        context += `## ${transcript.title} (${new Date(transcript.meeting_date).toLocaleDateString()})\n`;
        if (transcript.summary) {
          context += `Summary: ${transcript.summary}\n`;
        }
        if (transcript.key_points && transcript.key_points.length > 0) {
          context += `Key Points:\n${transcript.key_points.map((p: string) => `- ${p}`).join('\n')}\n`;
        }
        context += `\nFull Transcript:\n${transcript.content}\n\n`;
      }
    }

    // Add emails
    if (emailsResult.rows.length > 0) {
      context += '# Email Exchanges\n\n';
      for (const email of emailsResult.rows) {
        context += `## Email: ${email.subject}\n`;
        context += `From: ${email.from_address}\n`;
        context += `To: ${email.to_addresses.join(', ')}\n`;
        context += `Date: ${new Date(email.sent_date).toLocaleDateString()}\n`;
        context += `\n${email.body}\n\n`;
      }
    }

    // Add documents
    if (documentsResult.rows.length > 0) {
      context += '# Documents\n\n';
      for (const doc of documentsResult.rows) {
        context += `## ${doc.title} (${doc.type})\n`;
        if (doc.content) {
          context += `${doc.content}\n\n`;
        }
      }
    }

    // Add media files with extracted text
    if (mediaFilesResult.rows.length > 0) {
      context += '# Uploaded Media Files\n\n';
      for (const media of mediaFilesResult.rows) {
        context += `## ${media.title} (${media.file_type})\n`;
        context += `Original File: ${media.original_filename}\n`;
        if (media.description) {
          context += `Description: ${media.description}\n`;
        }
        if (media.extracted_text) {
          context += `\nContent:\n${media.extracted_text}\n\n`;
        }
      }
    }

    // Collect image files for Gemini vision (if any)
    const imageFiles: { path: string; mimeType: string; title: string; id: string }[] = [];
    for (const media of mediaFilesResult.rows) {
      if (media.mime_type?.startsWith('image/') && fs.existsSync(media.file_path)) {
        imageFiles.push({
          path: media.file_path,
          mimeType: media.mime_type,
          title: media.title,
          id: media.id
        });
      }
    }

    // Build sources array for response
    const sources: Array<{ type: string; id: string; title: string; excerpt: string }> = [];
    
    // Create the AI prompt
    const systemPrompt = `You are an AI assistant for Clarity.ai, a customer intelligence platform. You help employees understand their customers and prospects by analyzing all available information.

Your role is to:
1. Answer questions about customers/prospects based ONLY on the provided context
2. Provide specific, evidence-based answers with citations
3. If information is not available in the context, clearly state that
4. Be concise but thorough
5. When citing information, mention the source (e.g., "According to the kickoff meeting transcript..." or "In the email dated...")

Here is all the information we have about ${company.name}:

${context}

---

Now answer the following question. If you reference specific information, cite the source (transcript name, email subject, document title, or media file name). If the answer isn't in the provided context, say so.`;

    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

      // Build content parts array
      const contentParts: Part[] = [
        { text: systemPrompt },
        { text: `Question: ${question}` }
      ];

      // Add images to the request if available (Gemini vision)
      for (const img of imageFiles) {
        try {
          const imageData = fs.readFileSync(img.path);
          const base64Image = imageData.toString('base64');
          contentParts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: base64Image
            }
          });
          contentParts.push({ text: `[Image: ${img.title}]` });
        } catch (imgError) {
          console.error(`Failed to load image ${img.path}:`, imgError);
        }
      }

      const result = await model.generateContent(contentParts);

      const answer = result.response.text();

      // Extract sources mentioned in the answer
      for (const transcript of transcriptsResult.rows) {
        if (answer.toLowerCase().includes(transcript.title.toLowerCase()) || 
            answer.toLowerCase().includes('transcript') ||
            answer.toLowerCase().includes('meeting')) {
          sources.push({
            type: 'transcript',
            id: transcript.id,
            title: transcript.title,
            excerpt: transcript.summary || transcript.content.substring(0, 200) + '...'
          });
        }
      }

      for (const email of emailsResult.rows) {
        if (answer.toLowerCase().includes(email.subject.toLowerCase()) || 
            answer.toLowerCase().includes('email')) {
          sources.push({
            type: 'email',
            id: email.id,
            title: email.subject,
            excerpt: email.body.substring(0, 200) + '...'
          });
        }
      }

      for (const doc of documentsResult.rows) {
        if (answer.toLowerCase().includes(doc.title.toLowerCase()) || 
            answer.toLowerCase().includes(doc.type.toLowerCase())) {
          sources.push({
            type: 'document',
            id: doc.id,
            title: doc.title,
            excerpt: doc.content ? doc.content.substring(0, 200) + '...' : ''
          });
        }
      }

      // Add media files as sources
      for (const media of mediaFilesResult.rows) {
        if (answer.toLowerCase().includes(media.title.toLowerCase()) || 
            answer.toLowerCase().includes(media.file_type.toLowerCase()) ||
            answer.toLowerCase().includes(media.original_filename.toLowerCase()) ||
            answer.toLowerCase().includes('media') ||
            answer.toLowerCase().includes('file') ||
            answer.toLowerCase().includes('image') ||
            answer.toLowerCase().includes('screenshot')) {
          sources.push({
            type: 'media',
            id: media.id,
            title: media.title,
            excerpt: media.extracted_text ? media.extracted_text.substring(0, 200) + '...' : `[${media.file_type}: ${media.original_filename}]`
          });
        }
      }

      // Save to chat history
      await query(
        `INSERT INTO chat_history (company_id, user_id, question, answer, sources) 
         VALUES ($1, $2, $3, $4, $5)`,
        [company_id, req.user!.id, question, answer, JSON.stringify(sources)]
      );

      res.json({
        answer,
        sources: sources.slice(0, 5) // Limit to top 5 sources
      });

    } catch (aiError: any) {
      console.error('AI error:', aiError);
      
      // Provide a fallback response if AI fails
      if (aiError.message?.includes('API key')) {
        return res.status(500).json({ 
          error: 'AI service not configured. Please add your Gemini API key to the environment variables.' 
        });
      }
      
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

  } catch (error) {
    console.error('AI query error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chat history for a company
router.get('/history/:companyId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    const { limit = 20 } = req.query;

    const result = await query(
      `SELECT ch.*, u.name as user_name 
       FROM chat_history ch 
       JOIN users u ON ch.user_id = u.id 
       WHERE ch.company_id = $1 
       ORDER BY ch.created_at DESC 
       LIMIT $2`,
      [companyId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
