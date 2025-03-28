import React from 'react';
import { Mail, Phone, Building2 } from 'lucide-react';

interface ContactInfoProps {
  client: {
    email: string;
    phone: string;
    company: string;
  };
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ client }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
      <div className="space-y-4">
        <div className="flex items-center text-sm">
          <Mail className="h-5 w-5 text-gray-400 mr-2" />
          <span>{client.email}</span>
        </div>
        <div className="flex items-center text-sm">
          <Phone className="h-5 w-5 text-gray-400 mr-2" />
          <span>{client.phone || 'No phone number'}</span>
        </div>
        <div className="flex items-center text-sm">
          <Building2 className="h-5 w-5 text-gray-400 mr-2" />
          <span>{client.company || 'No company'}</span>
        </div>
      </div>
    </div>
  );
};