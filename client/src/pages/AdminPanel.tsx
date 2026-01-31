import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import {
  PlusIcon,
  BuildingOfficeIcon,
  PencilIcon,
  DocumentPlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function AdminPanel() {
  const { companies, fetchCompanies, deleteCompany, isLoading } = useCompanyStore();

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also delete all associated data.`)) {
      try {
        await deleteCompany(id);
      } catch (error) {
        console.error('Failed to delete company:', error);
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 mt-1">Manage companies and their content</p>
        </div>
        <Link
          to="/admin/company/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-clarity-600 hover:bg-clarity-700 text-white font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Company
        </Link>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Loading companies...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No companies yet. Add your first company to get started.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={company.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/company/${company.id}`}
                          className="font-medium text-gray-900 hover:text-clarity-600"
                        >
                          {company.name}
                        </Link>
                        <p className="text-sm text-gray-500">{company.industry || 'No industry'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        company.type === 'customer'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {company.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        company.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : company.status === 'churned' || company.status === 'lost'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {(company.transcript_count || 0) + (company.email_count || 0) + (company.document_count || 0)} items
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(company.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/company/${company.id}/content`}
                        className="p-2 text-gray-400 hover:text-clarity-600 hover:bg-clarity-50 rounded-lg transition-colors"
                        title="Add content"
                      >
                        <DocumentPlusIcon className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`/admin/company/${company.id}/edit`}
                        className="p-2 text-gray-400 hover:text-clarity-600 hover:bg-clarity-50 rounded-lg transition-colors"
                        title="Edit company"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(company.id, company.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete company"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
