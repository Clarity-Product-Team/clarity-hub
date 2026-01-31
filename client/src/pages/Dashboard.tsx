import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function Dashboard() {
  const { companies, fetchCompanies, isLoading } = useCompanyStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    fetchCompanies({ search, type: typeFilter });
  }, [fetchCompanies, search, typeFilter]);

  const customers = companies.filter((c) => c.type === 'customer');
  const prospects = companies.filter((c) => c.type === 'prospect');

  const stats = [
    { name: 'Total Customers', value: customers.length, color: 'bg-emerald-500' },
    { name: 'Total Prospects', value: prospects.length, color: 'bg-blue-500' },
    {
      name: 'Total ARR',
      value: `$${customers.reduce((sum, c) => sum + (c.contract_value || 0), 0).toLocaleString()}`,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Content',
      value: companies.reduce(
        (sum, c) => sum + (c.transcript_count || 0) + (c.email_count || 0) + (c.document_count || 0),
        0
      ),
      color: 'bg-amber-500',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          View and manage your customers and prospects
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <BuildingOfficeIcon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500"
          >
            <option value="">All Types</option>
            <option value="customer">Customers</option>
            <option value="prospect">Prospects</option>
          </select>
        </div>
      </div>

      {/* Companies List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-clarity-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading companies...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BuildingOfficeIcon className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No companies found</h3>
          <p className="text-gray-500 mt-1">Get started by adding your first company.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Link
              key={company.id}
              to={`/company/${company.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-clarity-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          company.type === 'customer'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {company.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {company.industry || 'No industry'} • {company.employee_count || 'Unknown size'}
                    </p>
                    {company.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{company.description}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {company.contract_value && (
                    <p className="text-lg font-semibold text-gray-900">
                      ${company.contract_value.toLocaleString()}
                    </p>
                  )}
                  {company.contract_start_date && (
                    <p className="text-sm text-gray-500">
                      Since {format(new Date(company.contract_start_date), 'MMM yyyy')}
                    </p>
                  )}
                </div>
              </div>

              {/* Content counts */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <VideoCameraIcon className="w-4 h-4" />
                  <span>{company.transcript_count || 0} transcripts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span>{company.email_count || 0} emails</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>{company.document_count || 0} documents</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
