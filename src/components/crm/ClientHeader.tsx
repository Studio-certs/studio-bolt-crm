import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
interface ClientHeaderProps {
  client: {
    name: string;
    company: string;
  };
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({ client }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-500"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-indigo-600" />
              {client.name}
            </h1>
            <p className="text-sm text-gray-500">{client.company}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
