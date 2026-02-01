import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import { useMediaStore } from '../stores/mediaStore';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  PlusIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

export default function CompanyAdmin() {
  const { id } = useParams<{ id: string }>();
  const { currentCompany, fetchCompany, isLoading } = useCompanyStore();
  const { 
    mediaFiles, 
    fetchMediaFiles, 
    uploadFile,
    analyzeFile,
    pasteContent: pasteContentFn,
    deleteMediaFile, 
    isUploading,
    isAnalyzing,
    uploadProgress 
  } = useMediaStore();
  const { token } = useAuthStore();
  
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadFileType, setUploadFileType] = useState<string>('document');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [analysisReason, setAnalysisReason] = useState<string>('');
  const [analysisConfidence, setAnalysisConfidence] = useState<string>('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (id) {
      fetchCompany(id);
      fetchMediaFiles(id);
    }
  }, [id, fetchCompany, fetchMediaFiles]);

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

  const startUploadFlow = async (files: File[]) => {
    setPendingFiles(files);
    setShowUploadModal(true);
    setUploadFileType('document');
    setUploadTitle(files[0]?.name.replace(/\.[^/.]+$/, '') || '');
    setAnalysisReason('');
    setAnalysisConfidence('');
    
    // Analyze the first file to suggest type
    if (files.length > 0) {
      const analysis = await analyzeFile(files[0]);
      setUploadFileType(analysis.suggestedType);
      setAnalysisReason(analysis.reason);
      setAnalysisConfidence(analysis.confidence);
      if (analysis.suggestedTitle) {
        setUploadTitle(analysis.suggestedTitle);
      }
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      startUploadFlow(Array.from(e.dataTransfer.files));
    }
  }, [analyzeFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      startUploadFlow(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleUploadConfirm = async () => {
    for (const file of pendingFiles) {
      await uploadFile(id!, file, uploadTitle || file.name.replace(/\.[^/.]+$/, ''), undefined, uploadFileType);
    }
    setSuccess(`${pendingFiles.length} file(s) uploaded successfully!`);
    setTimeout(() => setSuccess(''), 3000);
    setShowUploadModal(false);
    setPendingFiles([]);
    setUploadFileType('document');
    setUploadTitle('');
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    setDeletingId(mediaId);
    try {
      await deleteMediaFile(mediaId);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteTitle.trim() || !pasteText.trim()) return;
    
    await pasteContentFn(id!, pasteText, pasteTitle, '', 'transcript');
    setShowPasteModal(false);
    setPasteTitle('');
    setPasteText('');
    setSuccess('Content saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const getFileIcon = (fileType: string) => {
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

  const canPreview = (mimeType?: string) => {
    if (!mimeType) return false;
    return (
      mimeType.startsWith('image/') ||
      mimeType.startsWith('video/') ||
      mimeType.startsWith('audio/') ||
      mimeType === 'application/pdf' ||
      mimeType.startsWith('text/')
    );
  };

  const renderPreview = () => {
    if (!previewFile) return null;
    
    const { mime_type, title, extracted_text, original_filename } = previewFile;
    
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{original_filename}</p>
            </div>
            <button
              onClick={() => setPreviewFile(null)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            {mime_type?.startsWith('image/') && (
              <img 
                src={`/api/media/${previewFile.id}/download?token=${token}`} 
                alt={title} 
                className="max-w-full h-auto mx-auto rounded-lg"
              />
            )}
            
            {mime_type?.startsWith('video/') && (
              <video 
                src={`/api/media/${previewFile.id}/download?token=${token}`} 
                controls 
                className="max-w-full mx-auto rounded-lg"
              />
            )}
            
            {mime_type?.startsWith('audio/') && (
              <audio 
                src={`/api/media/${previewFile.id}/download?token=${token}`} 
                controls 
                className="w-full"
              />
            )}
            
            {mime_type === 'application/pdf' && (
              <iframe
                src={`/api/media/${previewFile.id}/download?token=${token}`}
                className="w-full h-[70vh] rounded-lg border border-gray-200"
                title={title}
              />
            )}
            
            {(mime_type?.startsWith('text/') || extracted_text) && (
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-[60vh] overflow-auto">
                {extracted_text || 'No text content available'}
              </div>
            )}
            
            {!canPreview(mime_type) && !extracted_text && (
              <div className="text-center py-12">
                <DocumentIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Preview not available for this file type</p>
                <a
                  href={`/api/media/${previewFile.id}/download?token=${token}`}
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-clarity-900 text-white rounded-lg hover:bg-clarity-800"
                  download
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading || !currentCompany) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-clarity-900 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Preview Modal */}
      {previewFile && renderPreview()}
      
      {/* Paste Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPasteModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Paste Text Content</h3>
              <button onClick={() => setShowPasteModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handlePasteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500"
                  placeholder="e.g., Sales Call Transcript - Jan 15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  required
                  rows={12}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 font-mono text-sm"
                  placeholder="Paste your transcript, notes, or any text content here..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!pasteTitle.trim() || !pasteText.trim()}
                  className="px-4 py-2 bg-clarity-900 text-white rounded-lg hover:bg-clarity-800 disabled:opacity-50"
                >
                  Save Content
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Type Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowUploadModal(false); setPendingFiles([]); }}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload {pendingFiles.length} File{pendingFiles.length > 1 ? 's' : ''}</h3>
              <button onClick={() => { setShowUploadModal(false); setPendingFiles([]); }} className="p-2 text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isAnalyzing ? (
                <div className="flex flex-col items-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-clarity-600 mb-4"></div>
                  <p className="text-sm text-gray-600">Analyzing file with AI...</p>
                  <p className="text-xs text-gray-400 mt-1">{pendingFiles[0]?.name}</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {pendingFiles.map(f => f.name).join(', ')}
                    </p>
                    {analysisReason && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-600 text-sm font-medium">🤖 AI Analysis</span>
                          {analysisConfidence && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              analysisConfidence === 'high' ? 'bg-green-100 text-green-700' :
                              analysisConfidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {analysisConfidence} confidence
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blue-800">{analysisReason}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Enter a descriptive title..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                    <select
                      value={uploadFileType}
                      onChange={(e) => setUploadFileType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500"
                    >
                      <option value="transcript">📝 Transcript (meeting/call recording)</option>
                      <option value="document">📄 Document</option>
                      <option value="email">📧 Email</option>
                      <option value="image">🖼️ Image</option>
                      <option value="video">🎥 Video</option>
                      <option value="audio">🎵 Audio</option>
                      <option value="other">📁 Other</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowUploadModal(false); setPendingFiles([]); }}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadConfirm}
                      disabled={isUploading}
                      className="px-4 py-2 bg-clarity-900 text-white rounded-lg hover:bg-clarity-800 disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading...' : 'Confirm & Upload'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              {currentCompany.logo_url ? (
                <img src={currentCompany.logo_url} alt={currentCompany.name} className="w-8 h-8 object-contain" />
              ) : (
                <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{currentCompany.name}</h1>
              <p className="text-sm text-gray-500 capitalize">{currentCompany.type} • {mediaFiles.length} files</p>
            </div>
          </div>
        </div>
        <Link
          to={`/admin/company/${id}/edit`}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300"
        >
          Edit Details
        </Link>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Uploading...</span>
            <span className="text-clarity-600 font-medium">{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-clarity-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all mb-6 ${
          dragActive
            ? 'border-clarity-500 bg-clarity-50'
            : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.md,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.mov,.avi,.mp3,.wav,.ogg,.json"
        />
        <CloudArrowUpIcon className={`w-12 h-12 mx-auto mb-3 ${dragActive ? 'text-clarity-500' : 'text-gray-400'}`} />
        <p className="text-gray-700 font-medium">
          {dragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mt-1">or click to browse</p>
        <p className="text-xs text-gray-400 mt-3">
          Supports: PDF, Images, Videos, Audio, Documents (up to 100MB each)
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPasteModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-clarity-900 hover:bg-clarity-50 border border-clarity-300 rounded-lg"
          >
            <PlusIcon className="w-4 h-4" />
            Paste Text
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Files ({mediaFiles.length})</h2>
        </div>
        
        {mediaFiles.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No files uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Drag and drop files above to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {mediaFiles.map((file) => {
              const Icon = getFileIcon(file.file_type);
              return (
                <div key={file.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  {/* Icon/Thumbnail */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {file.mime_type?.startsWith('image/') ? (
                      <img 
                        src={`/api/media/${file.id}/download?token=${token}`} 
                        alt={file.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.title}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="capitalize">{file.file_type}</span>
                      {file.file_size && <span>{formatFileSize(file.file_size)}</span>}
                      <span>{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    file.processing_status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : file.processing_status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {file.processing_status === 'completed' ? 'Ready' : 
                     file.processing_status === 'failed' ? 'Failed' : 'Processing'}
                  </span>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="p-2 text-gray-400 hover:text-clarity-900 hover:bg-clarity-50 rounded-lg"
                      title="Preview"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deletingId === file.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-700">
          <strong>How it works:</strong> Files you upload are processed and their content is made available to the AI. 
          When anyone asks questions about {currentCompany.name}, the AI will use these files to provide accurate, 
          evidence-based answers.
        </p>
      </div>
    </div>
  );
}
