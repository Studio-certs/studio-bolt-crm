import React, { useState, useEffect } from 'react';
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
      Calendar,
      FileText
    } from 'lucide-react';
    import { supabase } from '../lib/supabase';
    import { useAuth } from '../context/AuthContext';
    import { AddTemplateModal } from './modals/AddTemplateModal';
    import { EditTemplateModal } from './modals/EditTemplateModal';
    import { ViewTemplateModal } from './modals/ViewTemplateModal'; // Import the View modal

    interface Client {
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
      status: 'active' | 'inactive';
    }

    interface Template {
      id: string;
      name: string;
      type: string;
      prompt: string;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    }

    export const AdminDashboard: React.FC = () => {
      const { state: authState } = useAuth();
      const { user } = authState;
      const [users, setUsers] = useState<any[]>([]);
      const [clients, setClients] = useState<Client[]>([]);
      const [templates, setTemplates] = useState<Template[]>([]);
      const [totalLeads, setTotalLeads] = useState(0);
      const [totalLeadValue, setTotalLeadValue] = useState(0);
      const [recentActivity, setRecentActivity] = useState(0);
      const [isLoading, setIsLoading] = useState(true);
      const navigate = useNavigate();
      const [showClientModal, setShowClientModal] = useState(false);
      const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
      const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
      const [showViewTemplateModal, setShowViewTemplateModal] = useState(false); // State for view modal
      const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
      const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null); // State for template being viewed
      const [newClient, setNewClient] = useState<Partial<Client>>({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'active'
      });
      const [error, setError] = useState('');
      const [success, setSuccess] = useState('');

      useEffect(() => {
        fetchDashboardData();
      }, []);

      const fetchDashboardData = async () => {
        try {
          setIsLoading(true);
          await Promise.all([
            fetchUsers(),
            fetchClients(),
            fetchLeadStats(),
            fetchTemplates()
          ]);
        } finally {
          setIsLoading(false);
        }
      };

      // --- Fetch functions remain the same ---
      const fetchLeadStats = async () => {
        const { data: leadsData } = await supabase
          .from('client_leads')
          .select('id, value, created_at');

        if (leadsData) {
          setTotalLeads(leadsData.length);
          const totalValue = leadsData.reduce((sum, lead) => sum + (lead.value || 0), 0);
          setTotalLeadValue(totalValue);
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

      const fetchTemplates = async () => {
        const { data, error: templateError } = await supabase
          .from('templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (templateError) {
          console.error('Error fetching templates:', templateError);
          setError('Failed to load templates.');
        } else if (data) {
          setTemplates(data);
        }
      };
      // --- End Fetch functions ---


      const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

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

        setSuccess('Client added successfully!');
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

      const handleCreateTemplate = async (templateData: Omit<Template, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
        setError('');
        setSuccess('');

        if (!user) {
          setError('You must be logged in to create a template.');
          throw new Error('User not authenticated');
        }

        try {
          const { error: insertError } = await supabase
            .from('templates')
            .insert([{
              ...templateData,
              created_by: user.id
            }]);

          if (insertError) throw insertError;

          setSuccess('Template created successfully!');
          setShowAddTemplateModal(false);
          fetchTemplates();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create template.');
          console.error('Error creating template:', err);
          throw err;
        }
      };

      const handleUpdateTemplate = async (templateId: string, updatedData: Partial<Template>) => {
        setError('');
        setSuccess('');
        try {
          const { error: updateError } = await supabase
            .from('templates')
            .update({
              name: updatedData.name,
              type: updatedData.type,
              prompt: updatedData.prompt,
              updated_at: new Date().toISOString()
            })
            .eq('id', templateId);

          if (updateError) throw updateError;

          setSuccess('Template updated successfully!');
          setShowEditTemplateModal(false); // Close edit modal
          setEditingTemplate(null);
          fetchTemplates();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to update template.');
          console.error('Error updating template:', err);
          throw err; // Re-throw for the modal to handle
        }
      };

      // Function to open the view modal
      const openViewModal = (template: Template) => {
        setViewingTemplate(template);
        setShowViewTemplateModal(true);
      };

      // Function called when 'Edit' is clicked in the View modal
      const handleEditFromView = (template: Template) => {
        setShowViewTemplateModal(false); // Close view modal
        setViewingTemplate(null);
        setEditingTemplate(template); // Set template for editing
        setShowEditTemplateModal(true); // Open edit modal
      };

      // --- StatCard and QuickAction components remain the same ---
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
      // --- End StatCard and QuickAction ---


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

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-md">
              {success}
            </div>
          )}

          {/* Stats Grid */}
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

          {/* Quick Actions */}
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

          {/* Main Content Grid */}
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
                  <div
                    key={user.id}
                    onClick={() => navigate(`/admin/users/${user.id}`)} // Make user item clickable
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group" // Add group for hover effect
                  >
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
                          <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{user.name || 'No name'}</p> {/* Add hover effect */}
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" /> {/* Add chevron */}
                      </div>
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

          {/* Templates Section */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Templates</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage reusable templates
                  </p>
                </div>
                <button
                  onClick={() => setShowAddTemplateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {templates.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No templates found.</div>
              ) : (
                templates.slice(0, 5).map((template) => (
                  <div
                    key={template.id}
                    onClick={() => openViewModal(template)} // Changed onClick handler
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{template.name}</p>
                          <p className="text-sm text-gray-500">Type: {template.type}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        Created: {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {templates.length > 5 && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => { /* TODO: Navigate to template management page */ }}
                  className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                >
                  View all templates
                </button>
              </div>
            )}
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

          {/* Add Template Modal */}
          {showAddTemplateModal && (
            <AddTemplateModal
              onClose={() => setShowAddTemplateModal(false)}
              onSubmit={handleCreateTemplate}
            />
          )}

          {/* View Template Modal */}
          {showViewTemplateModal && viewingTemplate && (
            <ViewTemplateModal
              template={viewingTemplate}
              onClose={() => {
                setShowViewTemplateModal(false);
                setViewingTemplate(null);
              }}
              onEdit={handleEditFromView} // Pass the handler
            />
          )}

          {/* Edit Template Modal */}
          {showEditTemplateModal && editingTemplate && (
            <EditTemplateModal
              template={editingTemplate}
              onClose={() => {
                setShowEditTemplateModal(false);
                setEditingTemplate(null);
              }}
              onSubmit={handleUpdateTemplate}
            />
          )}
        </div>
      );
    };
