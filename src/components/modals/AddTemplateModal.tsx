import React, { useState } from 'react';
    import { X, AlertCircle } from 'lucide-react';

    interface TemplateData {
      name: string;
      type: string; // Keep type as string, but it will be controlled by the dropdown
      prompt: string;
    }

    interface AddTemplateModalProps {
      onClose: () => void;
      onSubmit: (templateData: TemplateData) => Promise<void>;
    }

    export const AddTemplateModal: React.FC<AddTemplateModalProps> = ({
      onClose,
      onSubmit,
    }) => {
      const [template, setTemplate] = useState<TemplateData>({
        name: '',
        type: 'email', // Default to 'email' as it's the only option for now
        prompt: '',
      });
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [modalError, setModalError] = useState('');

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Type validation is implicitly handled by the dropdown now
        if (!template.name.trim() || !template.prompt.trim()) {
          setModalError('Name and Prompt/Content fields are required.');
          return;
        }
        setModalError('');
        setIsSubmitting(true);
        try {
          await onSubmit(template);
          // If onSubmit doesn't throw, the parent component will close the modal
        } catch (err) {
          setModalError(err instanceof Error ? err.message : 'Failed to add template.');
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 transform transition-all duration-300 scale-100 opacity-100">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Template</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    id="template-name"
                    type="text"
                    required
                    value={template.name}
                    onChange={(e) => {
                      setTemplate({ ...template, name: e.target.value });
                      if (e.target.value.trim()) setModalError('');
                    }}
                    className={`mt-1 block w-full rounded-lg border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 ${modalError && !template.name.trim() ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., Follow-up Email Template"
                  />
                </div>

                <div>
                  <label htmlFor="template-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    id="template-type"
                    required
                    value={template.type}
                    onChange={(e) => {
                      setTemplate({ ...template, type: e.target.value });
                      // No need to clear error here as selection is always valid
                    }}
                    className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  >
                    <option value="email">Email</option>
                    {/* Add other options here in the future */}
                  </select>
                </div>

                <div>
                  <label htmlFor="template-prompt" className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt / Content *
                  </label>
                  <textarea
                    id="template-prompt"
                    required
                    value={template.prompt}
                    onChange={(e) => {
                      setTemplate({ ...template, prompt: e.target.value });
                      if (e.target.value.trim()) setModalError('');
                    }}
                    rows={6}
                    className={`mt-1 block w-full rounded-lg border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 ${modalError && !template.prompt.trim() ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter the template content or prompt..."
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !template.name.trim() || !template.prompt.trim()} // Type is always selected
                  className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Create Template'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };
