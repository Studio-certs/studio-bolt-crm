import React from 'react';
import { Lead } from '../../types/crm';

interface AddLeadModalProps {
  lead: Partial<Lead>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (lead: Partial<Lead>) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  lead,
  onClose,
  onSubmit,
  onChange,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Lead</h3>
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={lead.name}
                onChange={(e) => onChange({ ...lead, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={lead.email}
                onChange={(e) => onChange({ ...lead, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={lead.phone}
                onChange={(e) => onChange({ ...lead, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <input
                type="text"
                value={lead.company}
                onChange={(e) => onChange({ ...lead, company: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Source</label>
              <select
                value={lead.source}
                onChange={(e) => onChange({ ...lead, source: e.target.value as Lead['source'] })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="referral">Referral</option>
                <option value="website">Website</option>
                <option value="cold_call">Cold Call</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={lead.status}
                onChange={(e) => onChange({ ...lead, status: e.target.value as Lead['status'] })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Value ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={lead.value || ''}
                onChange={(e) => onChange({ ...lead, value: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={lead.notes}
              onChange={(e) => onChange({ ...lead, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};