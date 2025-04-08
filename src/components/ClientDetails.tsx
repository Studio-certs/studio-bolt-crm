import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Edit3, 
  X, 
  Save, 
  AlertCircle,
  Users,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronRight,
  Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'inactive';
}

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

interface Lead {
  id: string;
  name: string;
  company: string;
  status: string;
  value: number;
  created_at: string;
  client_id: string;
}

export const ClientDetails: React.FC = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: { user } } = useAuth();
  const [client, setClient] = React.useState<Client | null>(null);
  const [clientUsers, setClientUsers] = React.useState<ClientUser[]>([]);
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
    if (clientId) {
      checkAccess();
    }
  }, [clientId]);

  React.useEffect(() => {
    if (showAddUserModal) {
      fetchAvailableUsers();
    }
  }, [showAddUserModal]);

  const checkAccess = async () => {
    try {
      const { data: accessCheck } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('client_id', clientId)
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
        fetchLeads()
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
      .eq('id', clientId)
      .single();
    if (data) setClient(data);
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
      .eq('client_id', clientId);
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
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

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
        client_id: clientId,
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

  const handleRemoveUser = async (userId: string) => {
    const { error } = await supabase
      .from('client_users')
      .delete()
      .eq('client_id', clientId)
      .eq('user_id', userId);

    if (!error) {
      fetchClientUsers();
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newLead.name || !newLead.email) {
      setError('Name and email are required');
      return;
    }

    const { error: createError } = await supabase
      .from('client_leads')
      .insert([{
        client_id: clientId,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don't have permission to view this client.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:truncate">
                      {client.name}
                    </h1>
                    <span className={`ml-4 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                    {client.company && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Building2 className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        {client.company}
                      </div>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Mail className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {client.email}
                    </div>
                    {client.phone && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Phone className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <button
                onClick={() => navigate(`/clients/${clientId}/customers`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Manage Customers
              </button>
              <button
                onClick={() => setShowAddLeadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Alerts */}
        {(error) && (
          <div className="mb-6">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Leads Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Leads</h3>
                <p className="mt-1 text-sm text-gray-500">Track and manage sales opportunities</p>
              </div>
              <div className="divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <div className="p-6 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No leads</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding a new lead.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowAddLeadModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lead
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => navigate(`/clients/${clientId}/crm/leads/${lead.id}`)}
                        className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Users className="h-5 w-5 text-indigo-600" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{lead.name}</h4>
                              <p className="text-sm text-gray-500">{lead.company || 'No company'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              lead.status === 'won' ? 'bg-green-100 text-green-800' :
                              lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {lead.status}
                            </span>
                            {lead.value > 0 && (
                              <span className="text-sm font-medium text-gray-900">
                                ${lead.value.toLocaleString()}
                              </span>
                            )}
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          {user?.role === 'admin' && (
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Team Members</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage team access</p>
                </div>
                <div className="divide-y divide-gray-200">
                  {clientUsers.map((clientUser) => (
                    <div key={clientUser.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-800 font-medium text-sm">
                                {(clientUser.profiles?.name || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {clientUser.profiles?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {clientUser.profiles?.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveUser(clientUser.user_id)}
                          className="text-sm text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {clientUsers.length === 0 && (
                    <div className="p-6 text-center">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                      <p className="mt-1 text-sm text-gray-500">Add team members to collaborate.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Team Member</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Search Users
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-200">
                  {availableUsers
                    .filter(user => 
                      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
                      <label
                        key={user.id}
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                          selectedUserId === user.id ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="user"
                          value={user.id}
                          checked={selectedUserId === user.id}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUserId}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Lead</h3>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddLead}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Source</label>
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
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={newLead.status}
                    onChange={(e) => setNewLead({ ...newLead, status: e.target.value as Lead['status'] })}
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
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};