import React from 'react';
    import { X, FileText } from 'lucide-react';

    interface Template {
      id: string;
      name: string;
      type: string;
      prompt: string;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    }

    interface EmailTemplateSelectionModalProps {
      templates: Template[];
      onClose: () => void;
      onSelect: (template: Template) => void;
      isLoading: boolean;
    }

    export const EmailTemplateSelectionModal: React.FC<EmailTemplateSelectionModalProps> = ({
      templates,
      onClose,
      onSelect,
      isLoading,
    }) => {
      return (
        <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 transform transition-all duration-300 scale-100 opacity-100 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Select Email Template</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2"> {/* Added padding/margin for scrollbar */}
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <FileText className="mx-auto h-10 w-10 mb-2" />
                  No email templates found.
                </div>
              ) : (
                <ul className="space-y-3">
                  {templates.map((template) => (
                    <li key={template.id}>
                      <button
                        onClick={() => onSelect(template)}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                      >
                        <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2" title={template.prompt}>
                          {template.prompt}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    };
