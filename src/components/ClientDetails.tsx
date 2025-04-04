import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, X, Search, Users, Calendar, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lead } from '../types/crm';

interface ClientUser {
  id: string;
  user_id: string;
  role: 'member';
  profiles: {
    name: string;
    email: string;
  };
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
}

interface Customer {
  id: string;
  name: string;
  description: string;
  address: string;
}

export const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: { user } } = useAuth();
  const [client, setClient] = React.useState<any>(null);
  const [clientUsers, setClientUsers] = React.useState<ClientUser[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [showAddUserModal, setShowAddUserModal] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [availableUsers, setAvailableUsers] = React.useState<AvailableUser[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [accessDenied, setAccessDenied] = React.useState(false);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [showAddLeadModal, setShowAddLeadModal] = React.useState(false);
  const [newLead, setNewLead] = React.useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'other',
    status: 'new',
    notes: ''
  });

  React.useEffect(() => {
    if (id) {
      checkAccess();
    }
  }, [id]);

  React.useEffect(() => {
    if (showAddUserModal) {
      fetchAvailableUsers();
    }
  }, [showAddUserModal]);

  React.useEffect(() => {
    if (showAddLeadModal) {
      fetchCustomers();
    }
  }, [showAddLeadModal]);

  const checkAccess = async () => {
    try {
      // Check if user is admin or assigned to the client
      const { data: accessCheck } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('client_id', id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!accessCheck && user?.role !== 'admin') {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }

      await Promise.all([
        fetchClientDetails(),
        fetchClientUsers(),
        fetchLeads(),
        fetchCustomers()
      ]);
    } catch (error) {
      console.error('Error checking access:', error);
      setError('Error loading client details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientDetails = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (data) setClient(data);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('client_customers')
      .select('*')
      .eq('client_id', id)
      .order('name', { ascending: true });
    
    if (data) setCustomers(data);
  };

  const fetchClientUsers = async () => {
    const { data } = await supabase
      .from('client_users')
      .select(`
        id,
        user_id,
        role,
        profiles:profiles!client_users_user_id_fkey (
          name,
          email
        )
      `)
      .eq('client_id', id);
    if (data) setClientUsers(data);
  };

  const fetchAvailableUsers = async () => {
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('role', 'user');

    if (allUsers) {
      const assignedUserIds = clientUsers.map(cu => cu.user_id);
      const availableUsers = allUsers.filter(user => !assignedUserIds.includes(user.id));
      setAvailableUsers(availableUsers);
    }
  };

  const fetchLeads = async () => {
    try {
      let query = supabase
        .from('client_leads')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      // If user is not admin, only show leads they created
      if (user?.role !== 'admin') {
        query = query.eq('created_by', user?.id);
      }

      const { data } = await query;
      if (data) setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Error loading leads');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    const { error: createError } = await supabase
      .from('client_users')
      .insert([{
        client_id: id,
        user_id: selectedUserId,
        role: 'member'
      }]);

    if (createError) {
      setError(createError.message);
      return;
    }

    setShowAddUserModal(false);
    setSelectedUserId('');
    fetchClientUsers();
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newLead.name || !newLead.email) {
      setError('Name and email are required');
      return;
    }

    // Check for duplicate email
    const { data: existingLead } = await supabase
      .from('client_leads')
      .select('id')
      .eq('client_id', id)
      .eq('email', newLead.email)
      .maybeSingle();

    if (existingLead) {
      setError('A lead with this email already exists');
      return;
    }

    const { error: createError } = await supabase
      .from('client_leads')
      .insert([{
        client_id: id,
        ...newLead
      }]);

    if (createError) {
      setError(createError.message);
      return;
    }

    setShowAddLeadModal(false);
    setNewLead({
      name: '',
      email: '',
      phone: '',
      company: '',
      source: 'other',
      status: 'new',
      notes: ''
    });
    fetchLeads();
  };

  const handleRemoveUser = async (userId: string) => {
    const { error } = await supabase
      .from('client_users')
      .delete()
      .eq('client_id', id)
      .eq('user_id', userId);

    if (!error) {
      fetchClientUsers();
    }
  };

  const filteredUsers = availableUsers.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to view this client.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{client.email}</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate(`/clients/${id}/customers`)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Manage Customers
            </button>
            <button
              onClick={() => setShowAddLeadModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Users className="h-4 w-4 mr-2" />
              Add Lead
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Client Details</h3>
          <div className="mt-5 border-t border-gray-200">
            <dl className="divide-y divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {client.company || 'Not specified'}
                </dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {client.phone || 'Not specified'}
                </dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Leads</h3>
            <div className="mt-5">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr 
                        key={lead.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/clients/${id}/crm/leads/${lead.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{lead.email}</div>
                          {lead.phone && (
                            <div className="text-sm text-gray-500">{lead.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {lead.company || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            lead.status === 'won' ? 'bg-green-100 text-green-800' :
                            lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {lead.source}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Assigned Users</h3>
              <div className="mt-5">
                <div className="flow-root">
                  <ul role="list" className="-my-5 divide-y divide-gray-200">
                    {clientUsers.map((clientUser) => (
                      <li key={clientUser.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-800 font-medium text-sm">
                                {(clientUser.profiles?.name || 'M').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {clientUser.profiles?.name || 'Missing value'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {clientUser.profiles?.email || 'Missing value'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-blue-100 text-blue-800">
                              {clientUser.role}
                            </span>
                            <button
                              onClick={() => handleRemoveUser(clientUser.user_id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Lead</h3>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleAddLead}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <select
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a company</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.name}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Source
                  </label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value as Lead['source'] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={newLead.notes}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add User to Client</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Users
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No available users found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredUsers.map((availableUser) => (
                        <label
                          key={availableUser.id}
                          className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                            selectedUserId === availableUser.id ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="user"
                            value={availableUser.id}
                            checked={selectedUserId === availableUser.id}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {availableUser.name || 'No name'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {availableUser.email}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUserId}
                  className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
