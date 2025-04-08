import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import {
      Users,
      Shield,
      Bell,
      Settings,
      Plus,
      X,
      TrendingUp,
      Building2,
      DollarSign,
      ChevronRight,
      Star,
      CheckCircle2,
      AlertCircle,
      Calendar
    } from 'lucide-react';
    import { supabase } from '../lib/supabase';

    interface Client {
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
      status: 'active' | 'inactive';
    }

    export const AdminDashboard: React.FC = () => {
      const [users, setUsers] = React.useState<any[]>([]);
      const [clients, setClients] = React.useState<Client[]>([]);
      const [totalLeads, setTotalLeads] = React.useState(0);
      const [totalLeadValue, setTotalLeadValue] = React.useState(0);
      const [recentActivity, setRecentActivity] = React.useState(0);
      const [isLoading, setIsLoading] = React.useState(true);
      const navigate = useNavigate();
      const [showClientModal, setShowClientModal] = React.useState(false);
      const [newClient, setNewClient] = React.useState<Partial<Client>>({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'active'
      });
      const [error, setError] = React.useState('');

      React.useEffect(() => {
        fetchDashboardData();
      }, []);

      const fetchDashboardData = async () => {
        try {
          setIsLoading(true);
          await Promise.all([
            fetchUsers(),
            fetchClients(),
            fetchLeadStats()
          ]);
        } finally {
          setIsLoading(false);
        }
      };

      const fetchLeadStats = async () => {
        const { data: leadsData } = await supabase
          .from('client_leads')
          .select('id, value, created_at');

        if (leadsData) {
          setTotalLeads(leadsData.length);
          const totalValue = leadsData.reduce((sum, lead) => sum + (lead.value || 0), 0);
          setTotalLeadValue(totalValue);

          // Calculate recent activity (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentLeads = leadsData.filter(lead =>
            new Date(lead.created_at) > thirtyDaysAgo
          ).length;
          setRecentActivity(recentLeads);
        }
      };

      const fetchUsers = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setUsers(data);
      };

      const fetchClients = async () => {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setClients(data);
      };

      const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!newClient.name || !newClient.email) {
          setError('Name and email are required');
          return;
        }

        const { error: createError } = await supabase
          .from('clients')
          .insert([newClient]);

        if (createError) {
          setError(createError.message);
          return;
        }

        setShowClientModal(false);
        setNewClient({
          name: '',
          email: '',
          phone: '',
          company: '',
          status: 'active'
        });
        fetchClients();
      };

      const StatCard: React.FC<{
        title: string;
        value: string | number;
        icon: React.ReactNode;
        description: string;
        trend?: { value: number; isPositive: boolean };
        color: string;
      }> = ({ title, value, icon, description, trend, color }) => (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{value}</p>
                {trend && (
                  <span className={`ml-2 text-sm font-medium ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trend.isPositive ? '+' : '-'}{trend.value}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
            <div className={`rounded-xl p-3 ${color}`}>
              {icon}
            </div>
          </div>
        </div>
      );

      const QuickAction: React.FC<{
        title: string;
        description: string;
        icon: React.ReactNode;
        onClick: () => void;
      }> = ({ title, description, icon, onClick }) => (
        <button
          onClick={onClick}
          className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all w-full text-left group"
        >
          <div className="rounded-xl p-3 bg-indigo-50 mr-4">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
      );

      if (isLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        );
      }

      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage users, clients, and system settings
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <StatCard
              title="Total Leads"
              value={totalLeads}
              icon={<Users className="h-6 w-6 text-blue-600" />}
              description="Active opportunities"
              trend={{ value: 12, isPositive: true }}
              color="bg-blue-50"
            />
            <StatCard
              title="Total Revenue"
              value={`$${totalLeadValue.toLocaleString()}`}
              icon={<DollarSign className="h-6 w-6 text-green-600" />}
              description="From all leads"
              trend={{ value: 8, isPositive: true }}
              color="bg-green-50"
            />
            <StatCard
              title="Recent Activity"
              value={recentActivity}
              icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
              description="Last 30 days"
              color="bg-purple-50"
            />
            <StatCard
              title="Total Users"
              value={users.length}
              icon={<Users className="h-6 w-6 text-orange-600" />}
              description="Active platform users"
              color="bg-orange-50"
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickAction
                title="System Health"
                description="All systems operational"
                icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
                onClick={() => navigate('/admin/settings')}
              />
              <QuickAction
                title="Recent Alerts"
                description="3 new notifications"
                icon={<AlertCircle className="h-6 w-6 text-orange-600" />}
                onClick={() => {}}
              />
              <QuickAction
                title="Upcoming Tasks"
                description="2 tasks due today"
                icon={<Calendar className="h-6 w-6 text-purple-600" />}
                onClick={() => {}}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Clients Section */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Clients</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage your client relationships
                    </p>
                  </div>
                  <button
                    onClick={() => setShowClientModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {clients.slice(0, 5).map((client) => (
                  <div
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-500">{client.company || 'No company'}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {clients.length > 5 && (
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => {}}
                    className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    View all clients
                  </button>
                </div>
              )}
            </div>

            {/* Users Section */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Latest user activity and roles
                    </p>
                  </div>
                  {/* Removed Add User button */}
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name || 'No name'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {users.length > 5 && (
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    View all users
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Add Client Modal */}
          {showClientModal && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Client</h3>
                  <button
                    onClick={() => setShowClientModal(false)}
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

                <form onSubmit={handleCreateClient}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newClient.name}
                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={newClient.email}
                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={newClient.phone}
                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company
                      </label>
                      <input
                        type="text"
                        value={newClient.company}
                        onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        value={newClient.status}
                        onChange={(e) => setNewClient({ ...newClient, status: e.target.value as 'active' | 'inactive' })}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowClientModal(false)}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Create Client
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    };
