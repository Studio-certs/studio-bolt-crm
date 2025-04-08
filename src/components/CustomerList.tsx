import React from 'react';
    import { Building2, MapPin, ChevronRight, Info } from 'lucide-react';

    interface Customer {
      id: string;
      name: string;
      description: string;
      address: string;
      created_at: string;
    }

    interface CustomerListProps {
      customers: Customer[];
      isLoading: boolean; // Keep isLoading prop for potential future use, though handled in parent
      onCustomerClick: (customerId: string) => void;
    }

    export const CustomerList: React.FC<CustomerListProps> = ({ customers, isLoading, onCustomerClick }) => {

      if (customers.length === 0 && !isLoading) {
        return (
          <div className="p-12 text-center border-t border-gray-200">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add a new customer or refine your search.
            </p>
          </div>
        );
      }

      return (
        // Use a grid layout for cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => onCustomerClick(customer.id)}
            >
              <div className="p-5">
                <div className="flex items-start space-x-4 mb-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600"> {/* Reverted icon background */}
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors"> {/* Reverted hover color */}
                      {customer.name}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {customer.description || <span className="italic">No description</span>}
                    </p>
                  </div>
                </div>

                {customer.address && (
                  <div className="flex items-center text-xs text-gray-500 mt-3">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 px-5 py-3 flex justify-between items-center bg-gray-50 rounded-b-lg">
                <p className="text-xs text-gray-500">
                  Created: {new Date(customer.created_at).toLocaleDateString()}
                </p>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" /> {/* Reverted hover color */}
              </div>
            </div>
          ))}
        </div>
      );
    };
