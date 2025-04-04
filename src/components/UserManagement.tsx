import React from 'react';
import { Users, Mail, UserPlus, X, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  super_role: 'manager' | 'supervisor' | 'team_lead' | 'superadmin' | null;
  created_at: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [showAddUser, setShowAddUser] = React.useState(false);
  const [newUser, setNewUser] = React.useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUser.email || !newUser.password) {
      setError('Email and password are required');
      return;
    }

    try {
      // Use standard signup flow
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;

      if (newUser.name && authData.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            name: newUser.name,
            role: 'user'
          })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;
      }

      setSuccess('User created successfully. They can now sign in with their email and password.');
      setShowAddUser(false);
      setNewUser({ email: '', password: '', name: '' });
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating user role');
    }
  };

  const handleUpdateSuperRole = async (userId: string, newSuperRole: UserData['super_role']) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ super_role: newSuperRole })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating user super role');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="h-6 w-6 mr-2 text-indigo-600" />
          User Management
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage users and their roles
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-md">
          {success}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Users</h3>
            <button
              onClick={() => setShowAddUser(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Super Role
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-800 font-medium text-sm">
                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-2" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value as 'admin' | 'user')}
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.super_role || ''}
                        onChange={(e) => {
                          const value = e.target.value || null;
                          handleUpdateSuperRole(user.id, value as UserData['super_role']);
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">None</option>
                        <option value="manager">Manager</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="team_lead">Team Lead</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
