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
  AlertCircle
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

interface DashboardStats {
  totalClients: number;
  activeLeads: number;
  totalRevenue: number;
  recentActivity: number;
}

export const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const { user } = state;
  const navigate = useNavigate();
  const [assignedClients, setAssignedClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [stats, setStats] = React.useState<DashboardStats>({
    totalClients: 0,
    activeLeads: 0,
    totalRevenue: 0,
    recentActivity: 0
  });

  React.useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [clientsData, statsData] = await Promise.all([
        fetchAssignedClients(),
        fetchStats()
      ]);
      
      setAssignedClients(clientsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignedClients = async (): Promise<Client[]> => {
    if (!user?.id) return [];

    const { data: clientUsers } = await supabase
      .from('client_users')
      .select('client_id');
    
    if (!clientUsers?.length) return [];

    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .in('id', clientUsers.map(cu => cu.client_id))
      .order('created_at', { ascending: false });

    return clients || [];
  };

  const fetchStats = async (): Promise<DashboardStats> => {
    const { data: clientUsers } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('user_id', user?.id);

    const clientIds = clientUsers?.map(cu => cu.client_id) || [];

    const { data: leads } = await supabase
      .from('client_leads')
      .select('value, status, created_at')
      .in('client_id', clientIds);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    return {
      totalClients: clientIds.length,
      activeLeads: leads?.filter(l => l.status !== 'lost' && l.status !== 'won').length || 0,
      totalRevenue: leads?.reduce((sum, lead) => sum + (lead.value || 0), 0) || 0,
      recentActivity: leads?.filter(l => new Date(l.created_at) > thirtyDaysAgo).length || 0
    };
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description: string;
    trend?: { value: number; isPositive: boolean };
  }> = ({ title, value, icon, description, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
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
        <div className="rounded-full p-3 bg-primary-50">
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
      <div className="rounded-full p-3 bg-primary-50 mr-4">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h2>
        <p className="mt-1 text-sm text-gray-500 flex items-center">
          {user?.role === 'admin' ? (
            <>
              You have admin access.
              <Link 
                to="/admin" 
                className="ml-2 text-primary-600 hover:text-primary-900 flex items-center"
              >
                Go to Admin Dashboard
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </>
          ) : (
            'View and manage your assigned clients.'
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={<Building2 className="h-6 w-6 text-primary-600" />}
          description="Assigned clients"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Leads"
          value={stats.activeLeads}
          icon={<Users className="h-6 w-6 text-primary-600" />}
          description="In progress"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6 text-primary-600" />}
          description="From all leads"
        />
        <StatCard
          title="Recent Activity"
          value={stats.recentActivity}
          icon={<Clock className="h-6 w-6 text-primary-600" />}
          description="Last 30 days"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            title="View Reports"
            description="Check your performance metrics"
            icon={<TrendingUp className="h-6 w-6 text-primary-600" />}
            onClick={() => {}}
          />
          <QuickAction
            title="Important Tasks"
            description="3 tasks need attention"
            icon={<AlertCircle className="h-6 w-6 text-primary-600" />}
            onClick={() => {}}
          />
          <QuickAction
            title="Recent Success"
            description="2 deals closed this week"
            icon={<Star className="h-6 w-6 text-primary-600" />}
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Clients List */}
      <div>
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900">
              Your Assigned Clients
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage and view details of clients you're assigned to
            </p>
          </div>
          <ClientList clients={assignedClients} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};