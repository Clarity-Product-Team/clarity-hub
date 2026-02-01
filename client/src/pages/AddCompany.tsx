import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AddCompany() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCompany, fetchCompany, createCompany, updateCompany, isLoading } = useCompanyStore();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    type: 'prospect' as 'customer' | 'prospect',
    logo_url: '',
    website: '',
    industry: '',
    employee_count: '',
    description: '',
    status: 'active' as 'active' | 'inactive' | 'churned' | 'lost',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_title: '',
    contract_value: '',
    contract_start_date: '',
    contract_end_date: '',
    notes: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchCompany(id);
    }
  }, [id, fetchCompany]);

  useEffect(() => {
    if (isEditing && currentCompany) {
      setFormData({
        name: currentCompany.name || '',
        type: currentCompany.type || 'prospect',
        logo_url: currentCompany.logo_url || '',
        website: currentCompany.website || '',
        industry: currentCompany.industry || '',
        employee_count: currentCompany.employee_count || '',
        description: currentCompany.description || '',
        status: currentCompany.status || 'active',
        primary_contact_name: currentCompany.primary_contact_name || '',
        primary_contact_email: currentCompany.primary_contact_email || '',
        primary_contact_title: currentCompany.primary_contact_title || '',
        contract_value: currentCompany.contract_value?.toString() || '',
        contract_start_date: currentCompany.contract_start_date?.split('T')[0] || '',
        contract_end_date: currentCompany.contract_end_date?.split('T')[0] || '',
        notes: currentCompany.notes || '',
      });
    }
  }, [isEditing, currentCompany]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const dataToSave = {
        ...formData,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        contract_start_date: formData.contract_start_date || null,
        contract_end_date: formData.contract_end_date || null,
      };

      if (isEditing && id) {
        await updateCompany(id, dataToSave);
        navigate(`/company/${id}`);
      } else {
        const newCompany = await createCompany(dataToSave);
        navigate(`/company/${newCompany.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save company');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-clarity-900 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading company...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Back button */}
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Admin Panel
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isEditing ? 'Edit Company' : 'Add New Company'}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="e.g., Acme Inc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
              >
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="churned">Churned</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="e.g., Technology, Healthcare"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Count
              </label>
              <input
                type="text"
                name="employee_count"
                value={formData.employee_count}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="e.g., 100-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="Brief description of the company..."
              />
            </div>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="primary_contact_name"
                value={formData.primary_contact_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="John Doe"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="primary_contact_title"
                value={formData.primary_contact_title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="VP of Engineering"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="primary_contact_email"
                value={formData.primary_contact_email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="john@example.com"
              />
            </div>
          </div>
        </div>

        {/* Contract Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Value ($)
              </label>
              <input
                type="number"
                name="contract_value"
                value={formData.contract_value}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
                placeholder="50000"
              />
            </div>

            <div></div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="contract_start_date"
                value={formData.contract_start_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="contract_end_date"
                value={formData.contract_end_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
            placeholder="Internal notes about this company..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            to="/admin"
            className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-clarity-900 hover:bg-clarity-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : isEditing ? 'Update Company' : 'Create Company'}
          </button>
        </div>
      </form>
    </div>
  );
}
