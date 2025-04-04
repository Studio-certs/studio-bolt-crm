import React from 'react';
import { Building2, MapPin, ChevronRight } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  description: string;
  address: string;
  created_at: string;
}

interface CustomerListProps {
  customers: Customer[];
  isLoading: boolean;
  onCustomerClick: (customerId: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, isLoading, onCustomerClick }) => {
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-gray-200 h-12 w-12"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-8 text-center">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No customers yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first customer.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {customers.map((customer) => (
        <div 
          key={customer.id} 
          className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
          onClick={() => onCustomerClick(customer.id)}
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
                  {customer.name}
                </h4>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {customer.description || 'No description'}
                </p>
                {customer.address && (
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {customer.address}
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
};
