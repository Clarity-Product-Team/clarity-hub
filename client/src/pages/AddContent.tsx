import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import { useMediaStore } from '../stores/mediaStore';
import api from '../lib/api';
import {
  ArrowLeftIcon,
  VideoCameraIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';

type ContentType = 'transcript' | 'email' | 'document' | 'media';

export default function AddContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCompany, fetchCompany, isLoading } = useCompanyStore();
  const { uploadFile, pasteContent, isUploading, uploadProgress, error: mediaError } = useMediaStore();
  const [activeType, setActiveType] = useState<ContentType>('media');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Media upload state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteDescription, setPasteDescription] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');

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

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setMediaTitle(e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, ''));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMediaTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleMediaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    setError('');
    setSuccess('');
    
    try {
      await uploadFile(id!, selectedFile, mediaTitle, mediaDescription);
      setSuccess('File uploaded successfully! It will be available for AI queries.');
      setSelectedFile(null);
      setMediaTitle('');
      setMediaDescription('');
      fetchCompany(id!);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file');
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim() || !pasteTitle.trim()) return;
    
    setError('');
    setSuccess('');
    
    try {
      await pasteContent(id!, pastedText, pasteTitle, pasteDescription, 'transcript');
      setSuccess('Content saved successfully! It will be available for AI queries.');
      setPastedText('');
      setPasteTitle('');
      setPasteDescription('');
      fetchCompany(id!);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save content');
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return DocumentIcon;
    if (mimeType.startsWith('image/')) return PhotoIcon;
    if (mimeType.startsWith('video/')) return FilmIcon;
    if (mimeType.startsWith('audio/')) return MusicalNoteIcon;
    return DocumentIcon;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-clarity-900 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading...</p>
      </div>
    );
  }

  const contentTypes = [
    { id: 'media', name: 'Upload Media', icon: CloudArrowUpIcon },
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
      <p className="text-gray-500 mb-8">Upload files, add transcripts, emails, or documents for {currentCompany.name}</p>

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
                ? 'bg-clarity-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <type.icon className="w-5 h-5" />
            {type.name}
          </button>
        ))}
      </div>

      {/* Media Upload Form */}
      {activeType === 'media' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Media Files</h2>
            <p className="text-sm text-gray-500">
              Upload files (PDFs, images, videos, transcripts, documents) or paste text content. 
              The content will be processed and made available for AI queries.
            </p>
          </div>

          {/* Upload Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMode === 'file'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('paste')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMode === 'paste'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Paste Text
            </button>
          </div>

          {/* File Upload Mode */}
          {uploadMode === 'file' && (
            <form onSubmit={handleMediaUpload} className="space-y-4">
              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-clarity-500 bg-clarity-50'
                    : selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.md,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.mov,.avi,.mp3,.wav,.ogg,.json"
                />
                
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    {(() => {
                      const Icon = getFileIcon(selectedFile.type);
                      return <Icon className="w-10 h-10 text-green-600" />;
                    })()}
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setMediaTitle('');
                      }}
                      className="ml-4 p-1 text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">
                      {dragActive ? 'Drop file here' : 'Drag & drop a file here'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                      Supports: PDF, Images, Videos, Audio, Documents, Text files (up to 100MB)
                    </p>
                  </>
                )}
              </div>

              {/* Title & Description */}
              {selectedFile && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                      placeholder="Give this file a descriptive title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={mediaDescription}
                      onChange={(e) => setMediaDescription(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                      placeholder="Optional: Add context about this file"
                    />
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="text-clarity-600">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-clarity-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-6 py-2.5 bg-clarity-900 hover:bg-clarity-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          )}

          {/* Paste Text Mode */}
          {uploadMode === 'paste' && (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                  placeholder="e.g., Sales Call Transcript - Jan 15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={pasteDescription}
                  onChange={(e) => setPasteDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                  placeholder="Optional: Brief description of this content"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  required
                  rows={12}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500 font-mono text-sm"
                  placeholder="Paste your transcript, notes, or any text content here..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  {pastedText.length.toLocaleString()} characters
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!pastedText.trim() || !pasteTitle.trim() || isUploading}
                  className="px-6 py-2.5 bg-clarity-900 hover:bg-clarity-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Saving...' : 'Save Content'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

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
              className="px-6 py-2.5 bg-clarity-900 hover:bg-clarity-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
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
              className="px-6 py-2.5 bg-clarity-900 hover:bg-clarity-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
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
              className="px-6 py-2.5 bg-clarity-900 hover:bg-clarity-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Adding...' : 'Add Document'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
