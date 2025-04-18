import React from 'react';
    import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
    import { AuthProvider } from './context/AuthContext';
    import { useAuth } from './context/AuthContext';
    import { Layout } from './components/Layout';
    import { LoginForm } from './components/LoginForm';
    import { Dashboard } from './components/Dashboard';
    import { AdminDashboard } from './components/AdminDashboard';
    import { AdminSettings } from './components/AdminSettings';
    import { UserManagement } from './components/UserManagement';
    import { UserProfile } from './components/UserProfile';
    import { ClientDetails } from './components/ClientDetails';
    import { ClientCRM } from './components/ClientCRM';
    import { LeadDetails } from './components/crm/LeadDetails';
    import { CustomerDetails } from './components/CustomerDetails';
    import { CustomersPage } from './components/CustomersPage';
    import { TodoItemDetail } from './components/crm/TodoItemDetail';
    import { AdminViewUserProfile } from './components/AdminViewUserProfile'; // Import the new component

    function App() {
      return (
        <Router>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
        </Router>
      );
    }

    const LoadingSpinner = () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );

    const AuthenticatedApp: React.FC = () => {
      const { state } = useAuth();
      const { isAuthenticated, isLoading, user } = state;

      if (isLoading) {
        return <LoadingSpinner />;
      }

      if (!isAuthenticated) {
        return <LoginForm />;
      }

      const isAdmin = user?.role === 'admin';
      const isSuperAdmin = isAdmin && user?.super_role === 'superadmin';

      return (
        <Layout>
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/admin/settings" element={isAdmin ? <AdminSettings /> : <Navigate to="/" />} />
            <Route path="/admin/users" element={isSuperAdmin ? <UserManagement /> : <Navigate to="/" />} />
            <Route path="/admin/users/:userId" element={isAdmin ? <AdminViewUserProfile /> : <Navigate to="/" />} /> {/* New Admin Route */}

            {/* General Routes */}
            <Route path="/clients/:id" element={<ClientDetails />} />
            <Route path="/clients/:id/customers" element={<CustomersPage />} />
            <Route path="/clients/:id/customers/:customerId" element={<CustomerDetails />} />
            <Route path="/clients/:id/crm" element={<ClientCRM />} />
            <Route path="/clients/:id/crm/leads/:leadId" element={<LeadDetails />} />
            <Route path="/clients/:id/crm/leads/:leadId/todos/:todoId" element={<TodoItemDetail />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </Layout>
      );
    };

    export default App;
