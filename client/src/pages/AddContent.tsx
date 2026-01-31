import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import api from '../lib/api';
import {
  ArrowLeftIcon,
  VideoCameraIcon,
  EnvelopeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

type ContentType = 'transcript' | 'email' | 'document';

export default function AddContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCompany, fetchCompany, isLoading } = useCompanyStore();
  const [activeType, setActiveType] = useState<ContentType>('transcript');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Transcript form
  const [transcriptData, setTranscriptData] = useState({
    title: '',
    meeting_date: '',
    duration_minutes: '',
    participants: '',
    content: '',
    summary: '',
    key_points: '',
    video_url: '',
  });

  // Email form
  const [emailData, setEmailData] = useState({
    subject: '',
    from_address: '',
    to_addresses: '',
    cc_addresses: '',
    sent_date: '',
    body: '',
  });

  // Document form
  const [documentData, setDocumentData] = useState({
    title: '',
    type: 'other' as 'contract' | 'proposal' | 'presentation' | 'report' | 'other',
    content: '',
  });

  useEffect(() => {
    if (id) {
      fetchCompany(id);
    }
  }, [id, fetchCompany]);

  const handleTranscriptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await api.post('/transcripts', {
        company_id: id,
        title: transcriptData.title,
        meeting_date: transcriptData.meeting_date,
        duration_minutes: transcriptData.duration_minutes ? parseInt(transcriptData.duration_minutes) : null,
        participants: transcriptData.participants ? transcriptData.participants.split(',').map((p) => p.trim()) : [],
        content: transcriptData.content,
        summary: transcriptData.summary || null,
        key_points: transcriptData.key_points ? transcriptData.key_points.split('\n').filter((p) => p.trim()) : [],
        video_url: transcriptData.video_url || null,
      });

      setSuccess('Transcript added successfully!');
      setTranscriptData({
        title: '',
        meeting_date: '',
        duration_minutes: '',
        participants: '',
        content: '',
        summary: '',
        key_points: '',
        video_url: '',
      });
      fetchCompany(id!);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add transcript');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await api.post('/emails', {
        company_id: id,
        subject: emailData.subject,
        from_address: emailData.from_address,
        to_addresses: emailData.to_addresses.split(',').map((e) => e.trim()),
        cc_addresses: emailData.cc_addresses ? emailData.cc_addresses.split(',').map((e) => e.trim()) : [],
        sent_date: emailData.sent_date,
        body: emailData.body,
      });

      setSuccess('Email added successfully!');
      setEmailData({
        subject: '',
        from_address: '',
        to_addresses: '',
        cc_addresses: '',
        sent_date: '',
        body: '',
      });
      fetchCompany(id!);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add email');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await api.post('/documents', {
        company_id: id,
        title: documentData.title,
        type: documentData.type,
        content: documentData.content,
      });

      setSuccess('Document added successfully!');
      setDocumentData({
        title: '',
        type: 'other',
        content: '',
      });
      fetchCompany(id!);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add document');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !currentCompany) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-clarity-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading...</p>
      </div>
    );
  }

  const contentTypes = [
    { id: 'transcript', name: 'Transcript', icon: VideoCameraIcon },
    { id: 'email', name: 'Email', icon: EnvelopeIcon },
    { id: 'document', name: 'Document', icon: DocumentTextIcon },
  ];

  return (
    <div className="max-w-3xl">
      {/* Back button */}
      <Link
        to={`/company/${id}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to {currentCompany.name}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Content</h1>
      <p className="text-gray-500 mb-8">Add transcripts, emails, or documents for {currentCompany.name}</p>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Content Type Tabs */}
      <div className="flex gap-2 mb-6">
        {contentTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id as ContentType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeType === type.id
                ? 'bg-clarity-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <type.icon className="w-5 h-5" />
            {type.name}
          </button>
        ))}
      </div>

      {/* Transcript Form */}
      {activeType === 'transcript' && (
        <form onSubmit={handleTranscriptSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Meeting Transcript</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={transcriptData.title}
                onChange={(e) => setTranscriptData({ ...transcriptData, title: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="e.g., Q4 Planning Call"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Date *</label>
              <input
                type="datetime-local"
                value={transcriptData.meeting_date}
                onChange={(e) => setTranscriptData({ ...transcriptData, meeting_date: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={transcriptData.duration_minutes}
                onChange={(e) => setTranscriptData({ ...transcriptData, duration_minutes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="45"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Participants (comma-separated)</label>
              <input
                type="text"
                value={transcriptData.participants}
                onChange={(e) => setTranscriptData({ ...transcriptData, participants: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="John Doe, Jane Smith, Bob Wilson"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Transcript *</label>
              <textarea
                value={transcriptData.content}
                onChange={(e) => setTranscriptData({ ...transcriptData, content: e.target.value })}
                required
                rows={10}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500 font-mono text-sm"
                placeholder="Paste the full meeting transcript here..."
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
              <textarea
                value={transcriptData.summary}
                onChange={(e) => setTranscriptData({ ...transcriptData, summary: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="Brief summary of the meeting..."
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Points (one per line)</label>
              <textarea
                value={transcriptData.key_points}
                onChange={(e) => setTranscriptData({ ...transcriptData, key_points: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="Key point 1&#10;Key point 2&#10;Key point 3"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
              <input
                type="url"
                value={transcriptData.video_url}
                onChange={(e) => setTranscriptData({ ...transcriptData, video_url: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="https://zoom.us/rec/..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-clarity-600 hover:bg-clarity-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Adding...' : 'Add Transcript'}
            </button>
          </div>
        </form>
      )}

      {/* Email Form */}
      {activeType === 'email' && (
        <form onSubmit={handleEmailSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Email Exchange</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="Re: Project Update"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From *</label>
              <input
                type="email"
                value={emailData.from_address}
                onChange={(e) => setEmailData({ ...emailData, from_address: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="sender@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sent Date *</label>
              <input
                type="datetime-local"
                value={emailData.sent_date}
                onChange={(e) => setEmailData({ ...emailData, sent_date: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">To (comma-separated) *</label>
              <input
                type="text"
                value={emailData.to_addresses}
                onChange={(e) => setEmailData({ ...emailData, to_addresses: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="recipient@company.com, other@company.com"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">CC (comma-separated)</label>
              <input
                type="text"
                value={emailData.cc_addresses}
                onChange={(e) => setEmailData({ ...emailData, cc_addresses: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="cc@company.com"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Body *</label>
              <textarea
                value={emailData.body}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                required
                rows={10}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="Paste the email content here..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-clarity-600 hover:bg-clarity-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Adding...' : 'Add Email'}
            </button>
          </div>
        </form>
      )}

      {/* Document Form */}
      {activeType === 'document' && (
        <form onSubmit={handleDocumentSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Document</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={documentData.title}
                onChange={(e) => setDocumentData({ ...documentData, title: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="e.g., Q4 Proposal"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={documentData.type}
                onChange={(e) => setDocumentData({ ...documentData, type: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
              >
                <option value="contract">Contract</option>
                <option value="proposal">Proposal</option>
                <option value="presentation">Presentation</option>
                <option value="report">Report</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                value={documentData.content}
                onChange={(e) => setDocumentData({ ...documentData, content: e.target.value })}
                required
                rows={15}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="Paste the document content here..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-clarity-600 hover:bg-clarity-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Adding...' : 'Add Document'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
