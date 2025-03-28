import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ClientList } from './ClientList';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'active' | 'inactive';
}

export const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const { user } = state;
  const [assignedClients, setAssignedClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      fetchAssignedClients();
    }
  }, [user]);

  const fetchAssignedClients = async () => {
    try {
      if (!user?.id) {
        setAssignedClients([]);
        setIsLoading(false);
        return;
      }

      const { data: clientUsers, error: clientUsersError } = await supabase
        .from('client_users')
        .select('client_id');
      
      if (clientUsersError) throw clientUsersError;
      
      if (!clientUsers?.length) {
        setAssignedClients([]);
        setIsLoading(false);
        return;
      }

      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .in('id', clientUsers.map(cu => cu.client_id));

      if (clientsError) throw clientsError;

      setAssignedClients(clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setAssignedClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h2>
        <p className="mt-1 text-sm text-gray-500 flex items-center">
          {user?.role === 'admin' ? (
            <>
              You have admin access.
              <a 
                href="/admin" 
                className="ml-2 text-indigo-600 hover:text-indigo-900 flex items-center"
              >
                Go to Admin Dashboard
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </>
          ) : (
            'View and manage your assigned clients.'
          )}
        </p>
      </div>

      <div className="mt-8">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Your Assigned Clients
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage and view details of clients you're assigned to
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ClientList clients={assignedClients} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};