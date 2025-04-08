import React, { useState, useEffect, useMemo } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { ArrowLeft, Building2, Plus, Search, XCircle } from 'lucide-react';
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

    interface Client {
      id: string;
      name: string;
      email: string;
      company: string;
    }

    export const CustomersPage: React.FC = () => {
      const { id: clientId } = useParams<{ id: string }>();
      const navigate = useNavigate();
      const [customers, setCustomers] = useState<Customer[]>([]);
      const [isLoading, setIsLoading] = useState(true);
      const [showAddModal, setShowAddModal] = useState(false);
      const [error, setError] = useState('');
      const [client, setClient] = useState<Client | null>(null);
      const [searchTerm, setSearchTerm] = useState('');

      useEffect(() => {
        if (clientId) {
          fetchData();
        }
      }, [clientId]);

      const fetchData = async () => {
        try {
          setIsLoading(true);
          setError('');
          await Promise.all([
            fetchClient(),
            fetchCustomers()
          ]);
        } catch (err) {
          setError('Failed to load data. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };

      const fetchClient = async () => {
        const { data, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (clientError) throw clientError;
        if (data) setClient(data);
      };

      const fetchCustomers = async () => {
        const { data, error: customerError } = await supabase
          .from('client_customers')
          .select('*')
          .eq('client_id', clientId)
          .order('name', { ascending: true });

        if (customerError) throw customerError;
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
          fetchCustomers(); // Refresh the list
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error adding customer');
        }
      };

      const handleCustomerClick = (customerId: string) => {
        navigate(`/clients/${clientId}/customers/${customerId}`);
      };

      const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        return customers.filter(customer =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.description && customer.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }, [customers, searchTerm]);

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <button
                onClick={() => navigate(`/clients/${clientId}`)}
                className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Client Details
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {client?.name ? `${client.name} - Customers` : 'Customers'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage customer relationships for {client?.name || 'this client'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors" // Reverted color
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </button>
          </div>

          {/* Search and Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search customers by name, description, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" // Reverted focus color
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer List */}
          <div className="bg-white shadow sm:rounded-lg">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div> {/* Reverted spinner color */}
                <p className="mt-2 text-sm text-gray-500">Loading customers...</p>
              </div>
            ) : (
              <CustomerList
                customers={filteredCustomers}
                isLoading={false} // Already handled loading state above
                onCustomerClick={handleCustomerClick}
              />
            )}
          </div>

          {/* Add Customer Modal */}
          {showAddModal && (
            <AddCustomerModal
              onClose={() => setShowAddModal(false)}
              onSubmit={handleAddCustomer}
              error={error} // Pass error to modal if needed
            />
          )}
        </div>
      );
    };
