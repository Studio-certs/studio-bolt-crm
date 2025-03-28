import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Edit3, X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
  description: string;
  address: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  client_id: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  status: string;
  value: number;
  created_at: string;
  client_id: string;
}

export const CustomerDetails: React.FC = () => {
  const { id: clientId, customerId } = useParams<{ id: string; customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedCustomer, setEditedCustomer] = React.useState<Partial<Customer>>({});
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [relatedLeads, setRelatedLeads] = React.useState<Lead[]>([]);

  React.useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('client_customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      setCustomer(data);
      setEditedCustomer(data);

      // Fetch related leads
      const { data: leadsData } = await supabase
        .from('client_leads')
        .select('id, name, company, status, value, created_at, client_id')
        .eq('company', data.name)
        .order('created_at', { ascending: false });

      if (leadsData) setRelatedLeads(leadsData);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('Error loading customer details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');

      if (!editedCustomer.name) {
        setError('Name is required');
        return;
      }

      const { error: updateError } = await supabase
        .from('client_customers')
        .update({
          name: editedCustomer.name,
          description: editedCustomer.description,
          address: editedCustomer.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      setSuccess('Customer updated successfully');
      setIsEditing(false);
      fetchCustomerDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating customer');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-gray-500"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Building2 className="h-6 w-6 mr-2 text-primary-600" />
                  {customer.name}
                </h1>
                <p className="text-sm text-gray-500">Customer Details</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Customer
              </button>
            )}
            {isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedCustomer(customer);
                    setError('');
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`rounded-lg p-4 ${
            error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            <div className="flex">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error || success}</span>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Customer Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Customer Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedCustomer.name}
                      onChange={(e) => setEditedCustomer({ ...editedCustomer, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  {isEditing ? (
                    <textarea
                      value={editedCustomer.description}
                      onChange={(e) => setEditedCustomer({ ...editedCustomer, description: e.target.value })}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {customer.description || 'No description provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  {isEditing ? (
                    <textarea
                      value={editedCustomer.address}
                      onChange={(e) => setEditedCustomer({ ...editedCustomer, address: e.target.value })}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {customer.address || 'No address provided'}
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <p>Created on {new Date(customer.created_at).toLocaleDateString()}</p>
                    {customer.updated_at && (
                      <p>Last updated {new Date(customer.updated_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            {/* Related Leads */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Related Leads</h2>
              {relatedLeads.length === 0 ? (
                <p className="text-sm text-gray-500">No leads associated with this customer yet.</p>
              ) : (
                <div className="space-y-4">
                  {relatedLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/clients/${lead.client_id}/crm/leads/${lead.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{lead.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {new Date(lead.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lead.status === 'won' ? 'bg-green-100 text-green-800' :
                          lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                      {lead.value > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          Value: ${lead.value.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};