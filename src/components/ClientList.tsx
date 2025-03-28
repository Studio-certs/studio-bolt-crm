import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, ChevronRight } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'active' | 'inactive';
}

interface ClientListProps {
  clients: Client[];
  isLoading: boolean;
}

export const ClientList: React.FC<ClientListProps> = ({ clients, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="p-8 text-center">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No clients yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          You haven't been assigned to any clients yet.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {clients.map((client) => (
        <div 
          key={client.id} 
          className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
          onClick={() => navigate(`/clients/${client.id}`)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {client.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {client.company || 'No company'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  client.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/clients/${client.id}/crm`);
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Users className="h-3.5 w-3.5 mr-1" />
                  CRM
                </button>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};