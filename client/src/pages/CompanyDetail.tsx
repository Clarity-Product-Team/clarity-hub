import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import { useMediaStore } from '../stores/mediaStore';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  UserIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  PlusIcon,
  CloudArrowUpIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import type { Transcript, Email, Document, AIResponse, ChatMessage, MediaFile } from '../types';

type Tab = 'overview' | 'transcripts' | 'emails' | 'documents' | 'media' | 'ask';

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentCompany, fetchCompany, isLoading } = useCompanyStore();
  const { mediaFiles, fetchMediaFiles, deleteMediaFile } = useMediaStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);

  // AI Chat state
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (id) {
      fetchCompany(id);
      loadChatHistory(id);
      fetchMediaFiles(id);
    }
  }, [id, fetchCompany, fetchMediaFiles]);

  const loadChatHistory = async (companyId: string) => {
    try {
      const response = await api.get(`/ai/history/${companyId}`);
      setChatHistory(response.data);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !id) return;

    setIsAsking(true);
    setAiResponse(null);

    try {
      const response = await api.post('/ai/ask', {
        company_id: id,
        question: question.trim(),
      });
      setAiResponse(response.data);
      loadChatHistory(id);
      setQuestion('');
    } catch (error: any) {
      setAiResponse({
        answer: error.response?.data?.error || 'Failed to get response. Please try again.',
        sources: [],
      });
    } finally {
      setIsAsking(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    setDeletingMedia(mediaId);
    try {
      await deleteMediaFile(mediaId);
    } catch (error) {
      console.error('Failed to delete media file:', error);
    } finally {
      setDeletingMedia(null);
    }
  };

  const getMediaIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return PhotoIcon;
      case 'video': return FilmIcon;
      case 'audio': return MusicalNoteIcon;
      case 'pdf': return DocumentTextIcon;
      default: return DocumentIcon;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading || !currentCompany) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-clarity-900 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading company...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'transcripts', name: `Transcripts (${currentCompany.transcripts?.length || 0})` },
    { id: 'emails', name: `Emails (${currentCompany.emails?.length || 0})` },
    { id: 'documents', name: `Documents (${currentCompany.documents?.length || 0})` },
    { id: 'media', name: `Media Files (${mediaFiles?.length || 0})`, icon: CloudArrowUpIcon },
    { id: 'ask', name: 'Ask AI', icon: SparklesIcon },
  ];

  return (
    <div>
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Company Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
              {currentCompany.logo_url ? (
                <img src={currentCompany.logo_url} alt={currentCompany.name} className="w-10 h-10 object-contain" />
              ) : (
                <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{currentCompany.name}</h1>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    currentCompany.type === 'customer'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {currentCompany.type}
                </span>
              </div>
              <p className="text-gray-500 mt-1">
                {currentCompany.industry || 'No industry'} • {currentCompany.employee_count || 'Unknown size'}
              </p>
              {currentCompany.website && (
                <a
                  href={currentCompany.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-clarity-900 hover:text-clarity-800 text-sm mt-2"
                >
                  <GlobeAltIcon className="w-4 h-4" />
                  {currentCompany.website}
                </a>
              )}
            </div>
          </div>

          <div className="text-right">
            {currentCompany.contract_value && (
              <p className="text-2xl font-bold text-gray-900">
                ${currentCompany.contract_value.toLocaleString()}
              </p>
            )}
            {currentCompany.contract_start_date && (
              <p className="text-sm text-gray-500">
                Contract started {format(new Date(currentCompany.contract_start_date), 'MMM d, yyyy')}
              </p>
            )}
            {user?.role === 'admin' && (
              <div className="flex items-center gap-2 mt-3">
                <Link
                  to={`/admin/company/${id}/edit`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </Link>
                <Link
                  to={`/admin/company/${id}/content`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-clarity-900 hover:bg-clarity-800 rounded-lg"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Content
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Primary Contact */}
        {currentCompany.primary_contact_name && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="w-4 h-4" />
              <span className="font-medium">{currentCompany.primary_contact_name}</span>
              {currentCompany.primary_contact_title && (
                <span className="text-gray-400">• {currentCompany.primary_contact_title}</span>
              )}
            </div>
            {currentCompany.primary_contact_email && (
              <a
                href={`mailto:${currentCompany.primary_contact_email}`}
                className="flex items-center gap-1 text-sm text-clarity-900 hover:text-clarity-800"
              >
                <EnvelopeIcon className="w-4 h-4" />
                {currentCompany.primary_contact_email}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-clarity-900 text-clarity-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Description */}
            {currentCompany.description && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                <p className="text-gray-600">{currentCompany.description}</p>
              </div>
            )}

            {/* Notes */}
            {currentCompany.notes && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Internal Notes</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{currentCompany.notes}</p>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {currentCompany.transcripts?.slice(0, 3).map((t) => (
                  <div key={t.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <VideoCameraIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.title}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(t.meeting_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
                {currentCompany.emails?.slice(0, 3).map((e) => (
                  <div key={e.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.subject}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(e.sent_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Transcripts</span>
                  <span className="font-semibold text-gray-900">{currentCompany.transcript_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Emails</span>
                  <span className="font-semibold text-gray-900">{currentCompany.email_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Documents</span>
                  <span className="font-semibold text-gray-900">{currentCompany.document_count || 0}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3 mt-3">
                  <span className="text-gray-600">Total Files</span>
                  <span className="font-semibold text-gray-900">{currentCompany.media_file_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Ask AI Quick Access */}
            <div className="bg-clarity-900 rounded-xl p-6 text-white">
              <SparklesIcon className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Ask AI about {currentCompany.name}</h3>
              <p className="text-clarity-300 text-sm mb-4">
                Get instant answers based on all available data.
              </p>
              <button
                onClick={() => setActiveTab('ask')}
                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                Start Asking
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transcripts' && (
        <div className="space-y-4">
          {currentCompany.transcripts?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">No transcripts yet</h3>
              <p className="text-gray-500 mt-1">Add meeting transcripts to track conversations.</p>
            </div>
          ) : (
            currentCompany.transcripts?.map((transcript) => (
              <TranscriptCard
                key={transcript.id}
                transcript={transcript}
                expanded={expandedItems.has(transcript.id)}
                onToggle={() => toggleExpand(transcript.id)}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'emails' && (
        <div className="space-y-4">
          {currentCompany.emails?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <EnvelopeIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">No emails yet</h3>
              <p className="text-gray-500 mt-1">Add email exchanges to track communications.</p>
            </div>
          ) : (
            currentCompany.emails?.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                expanded={expandedItems.has(email.id)}
                onToggle={() => toggleExpand(email.id)}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          {currentCompany.documents?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">No documents yet</h3>
              <p className="text-gray-500 mt-1">Add documents to track proposals, contracts, and more.</p>
            </div>
          ) : (
            currentCompany.documents?.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                expanded={expandedItems.has(doc.id)}
                onToggle={() => toggleExpand(doc.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Media Files Tab */}
      {activeTab === 'media' && (
        <div className="space-y-4">
          {/* Upload button for admins */}
          {user?.role === 'admin' && (
            <div className="flex justify-end">
              <Link
                to={`/admin/company/${id}/content`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-clarity-900 hover:bg-clarity-800 text-white font-medium rounded-lg transition-colors"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                Upload Media
              </Link>
            </div>
          )}

          {mediaFiles?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <CloudArrowUpIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">No media files yet</h3>
              <p className="text-gray-500 mt-1">Upload files to make them available for AI queries.</p>
              {user?.role === 'admin' && (
                <Link
                  to={`/admin/company/${id}/content`}
                  className="inline-flex items-center gap-2 mt-4 text-clarity-900 hover:text-clarity-800 font-medium"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add your first file
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">File</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Type</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Size</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Uploaded</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mediaFiles?.map((media) => {
                    const Icon = getMediaIcon(media.file_type);
                    return (
                      <tr key={media.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Icon className="w-8 h-8 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{media.title}</p>
                              <p className="text-xs text-gray-500">{media.original_filename}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                            {media.file_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatFileSize(media.file_size)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            media.processing_status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : media.processing_status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {media.processing_status === 'completed' ? 'Ready' : 
                             media.processing_status === 'failed' ? 'Failed' : 'Processing'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {format(new Date(media.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/api/media/${media.id}/download`}
                              className="p-2 text-gray-400 hover:text-clarity-900 hover:bg-clarity-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <ArrowDownTrayIcon className="w-5 h-5" />
                            </a>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleDeleteMedia(media.id)}
                                disabled={deletingMedia === media.id}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-medium text-blue-900 mb-1">How media files work</h4>
            <p className="text-sm text-blue-700">
              Uploaded files are processed to extract text content. When you ask the AI questions about this company, 
              all uploaded media files are included in the context, allowing the AI to reference information from 
              PDFs, documents, transcripts, and even analyze images.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'ask' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            {/* Ask Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-clarity-900 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ask about {currentCompany.name}</h3>
                  <p className="text-sm text-gray-500">
                    AI will analyze all transcripts, emails, and documents to answer your question.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAskQuestion}>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., What are their main pain points? What's the contract value? Who's the main contact?"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                    disabled={isAsking}
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !question.trim()}
                    className="px-6 py-3 bg-clarity-900 hover:bg-clarity-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isAsking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Thinking...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-4 h-4" />
                        Ask
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* AI Response */}
            {aiResponse && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 bg-clarity-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">AI Response</h4>
                    <div className="prose prose-sm max-w-none markdown-content">
                      <ReactMarkdown>{aiResponse.answer}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {aiResponse.sources && aiResponse.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sources</h4>
                    <div className="space-y-2">
                      {aiResponse.sources.map((source, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3"
                        >
                          {source.type === 'transcript' && <VideoCameraIcon className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />}
                          {source.type === 'email' && <EnvelopeIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />}
                          {source.type === 'document' && <DocumentTextIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
                          {source.type === 'media' && <CloudArrowUpIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                          <div>
                            <span className="font-medium">{source.title}</span>
                            {source.excerpt && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{source.excerpt}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat History */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Questions</h3>
              {chatHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No questions asked yet.</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {chatHistory.map((chat) => (
                    <div key={chat.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <p className="text-sm font-medium text-gray-900">{chat.question}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(chat.created_at), 'MMM d, h:mm a')}
                        {chat.user_name && ` • ${chat.user_name}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function TranscriptCard({
  transcript,
  expanded,
  onToggle,
}: {
  transcript: Transcript;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <VideoCameraIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{transcript.title}</h4>
            <p className="text-sm text-gray-500">
              {format(new Date(transcript.meeting_date), 'MMMM d, yyyy')}
              {transcript.duration_minutes && ` • ${transcript.duration_minutes} min`}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {transcript.participants && transcript.participants.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Participants</h5>
              <div className="flex flex-wrap gap-2">
                {transcript.participants.map((p, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {transcript.summary && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Summary</h5>
              <p className="text-sm text-gray-600">{transcript.summary}</p>
            </div>
          )}

          {transcript.key_points && transcript.key_points.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Key Points</h5>
              <ul className="list-disc list-inside space-y-1">
                {transcript.key_points.map((point, idx) => (
                  <li key={idx} className="text-sm text-gray-600">{point}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Full Transcript</h5>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{transcript.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmailCard({
  email,
  expanded,
  onToggle,
}: {
  email: Email;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <EnvelopeIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{email.subject}</h4>
            <p className="text-sm text-gray-500">
              From: {email.from_address} • {format(new Date(email.sent_date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="font-medium text-gray-700">From:</span> {email.from_address}</p>
            <p><span className="font-medium text-gray-700">To:</span> {email.to_addresses.join(', ')}</p>
            {email.cc_addresses && email.cc_addresses.length > 0 && (
              <p><span className="font-medium text-gray-700">CC:</span> {email.cc_addresses.join(', ')}</p>
            )}
            <p><span className="font-medium text-gray-700">Date:</span> {format(new Date(email.sent_date), 'MMMM d, yyyy h:mm a')}</p>
          </div>

          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Message</h5>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{email.body}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentCard({
  document,
  expanded,
  onToggle,
}: {
  document: Document;
  expanded: boolean;
  onToggle: () => void;
}) {
  const typeColors: Record<string, string> = {
    contract: 'bg-emerald-100 text-emerald-700',
    proposal: 'bg-blue-100 text-blue-700',
    presentation: 'bg-purple-100 text-purple-700',
    report: 'bg-amber-100 text-amber-700',
    other: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <DocumentTextIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{document.title}</h4>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[document.type] || typeColors.other}`}>
                {document.type}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Added {format(new Date(document.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && document.content && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Content</h5>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{document.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
