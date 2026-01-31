import { create } from 'zustand';
import api from '../lib/api';
import type { Company, CompanyWithDetails } from '../types';

interface CompanyState {
  companies: Company[];
  currentCompany: CompanyWithDetails | null;
  isLoading: boolean;
  error: string | null;
  fetchCompanies: (filters?: { type?: string; status?: string; search?: string }) => Promise<void>;
  fetchCompany: (id: string) => Promise<void>;
  createCompany: (data: Partial<Company>) => Promise<Company>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  currentCompany: null,
  isLoading: false,
  error: null,

  fetchCompanies: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const response = await api.get(`/companies?${params.toString()}`);
      set({ companies: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch companies', 
        isLoading: false 
      });
    }
  },

  fetchCompany: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/companies/${id}`);
      set({ currentCompany: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch company', 
        isLoading: false 
      });
    }
  },

  createCompany: async (data) => {
    const response = await api.post('/companies', data);
    const newCompany = response.data;
    set({ companies: [...get().companies, newCompany] });
    return newCompany;
  },

  updateCompany: async (id, data) => {
    const response = await api.put(`/companies/${id}`, data);
    const updatedCompany = response.data;
    set({
      companies: get().companies.map((c) => (c.id === id ? updatedCompany : c)),
      currentCompany: get().currentCompany?.id === id 
        ? { ...get().currentCompany!, ...updatedCompany }
        : get().currentCompany,
    });
    return updatedCompany;
  },

  deleteCompany: async (id) => {
    await api.delete(`/companies/${id}`);
    set({
      companies: get().companies.filter((c) => c.id !== id),
      currentCompany: get().currentCompany?.id === id ? null : get().currentCompany,
    });
  },
}));
