import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { LogOut, LayoutDashboard, Settings, Users } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
        isActive
          ? 'border-white text-white'
          : 'border-transparent text-primary-100 hover:border-primary-100 hover:text-white'
      }`
    }
  >
    {children}
  </NavLink>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, logout } = useAuth();
  const { user } = state;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary-600 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <LayoutDashboard className="h-8 w-8 text-white" />
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-6">
                <NavItem to="/">
                  Dashboard
                </NavItem>
                {user.role === 'admin' && user.super_role === 'superadmin' && (
                  <>
                  <NavItem to="/admin">
                    Admin
                  </NavItem>
                  <NavItem to="/admin/users">
                    Users
                  </NavItem>
                  <NavItem to="/admin/settings">
                    Settings
                  </NavItem>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <NavLink to="/profile">
                  <img
                    className="h-8 w-8 rounded-full cursor-pointer hover:ring-2 hover:ring-indigo-500"
                    src={user.avatar}
                    alt={user.name}
                  />
                </NavLink>
              </div>
              <div className="ml-4 md:hidden">
                <button
                  onClick={logout}
                  className="rounded-md bg-primary-700 p-2 text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
              <div className="hidden md:ml-4 md:flex md:flex-shrink-0 md:items-center">
                <button
                  onClick={logout}
                  className="rounded-md bg-primary-700 p-2 text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};