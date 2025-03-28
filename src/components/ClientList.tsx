import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users } from 'lucide-react';

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
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="px-4 py-5 text-center text-gray-500">
        You haven't been assigned to any clients yet.
      </div>
    );
  }

  return (
    <ul role="list" className="divide-y divide-gray-200">
      {clients.map((client) => (
        <li 
          key={client.id} 
          className="px-4 py-5 sm:px-6 hover:bg-gray-50 cursor-pointer"
          onClick={() => navigate(`/clients/${client.id}`)}
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Building className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {client.name}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {client.company || 'No company'}
              </p>
            </div>
            <div>
              <div className="flex items-center space-x-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
              >
                <Users className="h-3 w-3 mr-1" />
                CRM
              </button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};