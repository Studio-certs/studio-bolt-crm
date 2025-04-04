import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Users, Clock, CheckSquare } from 'lucide-react';
import { Lead } from '../../types/crm';
import { AddLeadModal } from './modals/AddLeadModal';

interface LeadWithMeta extends Lead {
  pending_tasks?: number;
  last_activity?: string;
}

interface LeadsSectionProps {
  leads: LeadWithMeta[];
  showAddLead: boolean;
  onShowAddLead: (show: boolean) => void;
  onAddLead: (e: React.FormEvent) => void;
  newLead: Partial<Lead>;
  onLeadChange: (lead: Partial<Lead>) => void;
}

export const LeadsSection: React.FC<LeadsSectionProps> = ({
  leads,
  showAddLead,
  onShowAddLead,
  onAddLead,
  newLead,
  onLeadChange,
}) => {
  const navigate = useNavigate();
  const { id: clientId } = useParams<{ id: string }>();

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6 lg:col-span-3">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Leads</h2>
            <p className="text-sm text-gray-500">Manage and track potential opportunities</p>
          </div>
          <button
            onClick={() => onShowAddLead(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/clients/${clientId}/crm/leads/${lead.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-100 text-secondary-800">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lead.status === 'won' ? 'bg-success-50 text-success-700' :
                      lead.status === 'lost' ? 'bg-danger-50 text-danger-700' :
                      lead.status === 'proposal' ? 'bg-warning-50 text-warning-700' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <CheckSquare className="h-4 w-4 mr-1 text-gray-400" />
                      {lead.pending_tasks || 0} pending
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {lead.last_activity ? new Date(lead.last_activity).toLocaleDateString() : 'No activity'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    ${lead.value?.toLocaleString() || '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddLead && (
        <AddLeadModal
          lead={newLead}
          onClose={() => onShowAddLead(false)}
          onSubmit={onAddLead}
          onChange={onLeadChange}
        />
      )}
    </>
  );
};
