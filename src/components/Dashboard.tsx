import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Users, 
  Building2, 
  TrendingUp,
  Clock,
  DollarSign,
  ChevronRight,
  Star,
  CheckCircle2,
  AlertCircle,
  Shield,
  Settings,
  LayoutDashboard,
  Calendar,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ClientList } from './ClientList';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'active' | 'inactive';
}

interface QuickAccessItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  link: string;
}

export const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const { user } = state;
  const navigate = useNavigate();
  const [assignedClients, setAssignedClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [totalLeads, setTotalLeads] = React.useState(0);
  const [totalLeadValue, setTotalLeadValue] = React.useState(0);
  const [recentActivity, setRecentActivity] = React.useState(0);
  const [systemHealth, setSystemHealth] = React.useState(98);

  React.useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchAssignedClients(),
        fetchLeadStats()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignedClients = async () => {
    try {
      if (!user?.id) {
        setAssignedClients([]);
        return;
      }

      const { data: clientUsers } = await supabase
        .from('client_users')
        .select('client_id');
      
      if (!clientUsers?.length) {
        setAssignedClients([]);
        return;
      }

      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .in('id', clientUsers.map(cu => cu.client_id));

      if (clients) setAssignedClients(clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setAssignedClients([]);
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

  const quickAccessItems: QuickAccessItem[] = [
    {
      title: 'Recent Leads',
      description: 'View and manage your latest leads',
      icon: <Users className="h-6 w-6 text-indigo-600" />,
      color: 'bg-indigo-50',
      link: '/leads'
    },
    {
      title: 'Upcoming Meetings',
      description: 'Check your scheduled meetings',
      icon: <Calendar className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-50',
      link: '/meetings'
    },
    {
      title: 'Client Communications',
      description: 'Recent messages and updates',
      icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-50',
      link: '/messages'
    },
    {
      title: 'Contact Directory',
      description: 'Access your contact list',
      icon: <Phone className="h-6 w-6 text-green-600" />,
      color: 'bg-green-50',
      link: '/contacts'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h2>
        {user?.role === 'admin' && (
          <div className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Admin Access Granted</h3>
                  <p className="text-white/80 mt-1">
                    You have full administrative privileges to manage system settings and configurations.
                  </p>
                </div>
              </div>
              <Link 
                to="/admin"
                className="flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors group"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Admin Dashboard
                <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/admin/settings"
                className="flex items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Settings className="h-5 w-5 mr-3" />
                <span>System Settings</span>
              </Link>
              <div className="flex items-center p-3 bg-white/10 rounded-lg">
                <Shield className="h-5 w-5 mr-3" />
                <span>Full Access</span>
              </div>
              <div className="flex items-center p-3 bg-white/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 mr-3" />
                <span>System Health: {systemHealth}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 mb-8">
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
          title="System Health"
          value={`${systemHealth}%`}
          icon={<CheckCircle2 className="h-6 w-6 text-orange-600" />}
          description="All systems operational"
          color="bg-orange-50"
        />
      </div>

      {/* Quick Access Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccessItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className={`${item.color} rounded-lg p-3 inline-block`}>
                {item.icon}
              </div>
              <h4 className="mt-4 text-base font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h4>
              <p className="mt-1 text-sm text-gray-500">
                {item.description}
              </p>
              <div className="mt-4 flex items-center text-sm text-indigo-600 font-medium">
                View
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
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
