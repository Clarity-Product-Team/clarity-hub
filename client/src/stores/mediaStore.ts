import { create } from 'zustand';
import api from '../lib/api';
import type { MediaFile } from '../types';

interface FileAnalysis {
  suggestedType: string;
  confidence: string;
  reason: string;
  suggestedTitle?: string;
}

interface MediaState {
  mediaFiles: MediaFile[];
  isLoading: boolean;
  isUploading: boolean;
  isAnalyzing: boolean;
  uploadProgress: number;
  error: string | null;
  fetchMediaFiles: (companyId: string) => Promise<void>;
  analyzeFile: (file: File) => Promise<FileAnalysis>;
  uploadFile: (companyId: string, file: File, title?: string, description?: string, fileType?: string) => Promise<MediaFile>;
  pasteContent: (companyId: string, content: string, title: string, description?: string, contentType?: string) => Promise<MediaFile>;
  updateMediaFile: (id: string, data: Partial<MediaFile>) => Promise<MediaFile>;
  deleteMediaFile: (id: string) => Promise<void>;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  mediaFiles: [],
  isLoading: false,
  isUploading: false,
  isAnalyzing: false,
  uploadProgress: 0,
  error: null,

  fetchMediaFiles: async (companyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/media/company/${companyId}`);
      set({ mediaFiles: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch media files',
        isLoading: false
      });
    }
  },

  analyzeFile: async (file: File) => {
    set({ isAnalyzing: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/media/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      set({ isAnalyzing: false });
      return response.data;
    } catch (error: any) {
      set({ isAnalyzing: false });
      return {
        suggestedType: 'document',
        confidence: 'low',
        reason: 'Analysis failed'
      };
    }
  },

  uploadFile: async (companyId, file, title, description, fileType) => {
    set({ isUploading: true, uploadProgress: 0, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      if (fileType) formData.append('fileType', fileType);

      const response = await api.post(`/media/upload/${companyId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          set({ uploadProgress: progress });
        },
      });

      const newFile = response.data;
      set({
        mediaFiles: [newFile, ...get().mediaFiles],
        isUploading: false,
        uploadProgress: 100
      });
      return newFile;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to upload file',
        isUploading: false,
        uploadProgress: 0
      });
      throw error;
    }
  },

  pasteContent: async (companyId, content, title, description, contentType) => {
    set({ isUploading: true, error: null });
    try {
      const response = await api.post(`/media/paste/${companyId}`, {
        content,
        title,
        description,
        contentType
      });

      const newFile = response.data;
      set({
        mediaFiles: [newFile, ...get().mediaFiles],
        isUploading: false
      });
      return newFile;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to save content',
        isUploading: false
      });
      throw error;
    }
  },

  updateMediaFile: async (id, data) => {
    const response = await api.put(`/media/${id}`, data);
    const updated = response.data;
    set({
      mediaFiles: get().mediaFiles.map((m) => (m.id === id ? updated : m))
    });
    return updated;
  },

  deleteMediaFile: async (id) => {
    await api.delete(`/media/${id}`);
    set({
      mediaFiles: get().mediaFiles.filter((m) => m.id !== id)
    });
  }
}));
