import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CustomerList } from './CustomerList';
import { AddCustomerModal } from './modals/AddCustomerModal';

interface Customer {
  id: string;
  name: string;
  description: string;
  address: string;
  created_at: string;
}

export const CustomerDetails: React.FC = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [error, setError] = React.useState('');
  const [client, setClient] = React.useState<any>(null);

  React.useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchClient(),
        fetchCustomers()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClient = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (data) setClient(data);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('client_customers')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (data) setCustomers(data);
  };

  const handleAddCustomer = async (customer: Omit<Customer, 'id' | 'created_at'>) => {
    try {
      setError('');

      const { error: createError } = await supabase
        .from('client_customers')
        .insert([{
          client_id: clientId,
          ...customer
        }]);

      if (createError) throw createError;

      setShowAddModal(false);
      fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding customer');
    }
  };

  const handleCustomerClick = (customerId: string) => {
    // Navigate to customer details page when implemented
    console.log('Customer clicked:', customerId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate(`/clients/${clientId}`)}
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Client
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-indigo-600" />
              {client?.name} - Customers
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage customer relationships for {client?.name}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <CustomerList
            customers={customers}
            isLoading={isLoading}
            onCustomerClick={handleCustomerClick}
          />
        </div>
      </div>

      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddCustomer}
          error={error}
        />
      )}
    </div>
  );
};