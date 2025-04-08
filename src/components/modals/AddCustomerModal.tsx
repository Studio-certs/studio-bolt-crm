import React, { useState } from 'react';
    import { X, AlertCircle } from 'lucide-react';

    interface Customer {
      name: string;
      description: string;
      address: string;
    }

    interface AddCustomerModalProps {
      onClose: () => void;
      onSubmit: (customer: Customer) => Promise<void>; // Make onSubmit async
      error?: string;
    }

    export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
      onClose,
      onSubmit,
      error: initialError // Rename prop to avoid conflict
    }) => {
      const [customer, setCustomer] = useState<Customer>({
        name: '',
        description: '',
        address: ''
      });
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [modalError, setModalError] = useState(initialError || ''); // Use local state for error

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer.name.trim()) {
          setModalError('Customer name is required.');
          return;
        }
        setModalError('');
        setIsSubmitting(true);
        try {
          await onSubmit(customer);
          // If onSubmit doesn't throw, it implies success (modal will be closed by parent)
        } catch (err) {
          // If onSubmit throws, catch the error here (though parent might also catch it)
          setModalError(err instanceof Error ? err.message : 'Failed to add customer.');
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all duration-300 scale-100 opacity-100">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Customer</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" // Reverted focus color
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center text-sm">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => {
                      setCustomer({ ...customer, name: e.target.value });
                      if (e.target.value.trim()) setModalError(''); // Clear error on input
                    }}
                    className={`mt-1 block w-full rounded-lg border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 ${modalError && !customer.name.trim() ? 'border-red-500' : 'border-gray-300'}`} // Reverted focus color
                    placeholder="e.g., Acme Corporation"
                  />
                </div>

                <div>
                  <label htmlFor="customer-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="customer-description"
                    value={customer.description}
                    onChange={(e) => setCustomer({ ...customer, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3" // Reverted focus color
                    placeholder="Brief description of the customer"
                  />
                </div>

                <div>
                  <label htmlFor="customer-address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    id="customer-address"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3" // Reverted focus color
                    placeholder="e.g., 123 Main St, Anytown, USA"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50" // Reverted focus color
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !customer.name.trim()}
                  className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" // Reverted color
                >
                  {isSubmitting ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Add Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };
