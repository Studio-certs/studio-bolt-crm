import React from 'react';
    import { X, Edit } from 'lucide-react';

    interface Template {
      id: string;
      name: string;
      type: string;
      prompt: string;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    }

    interface ViewTemplateModalProps {
      template: Template;
      onClose: () => void;
      onEdit: (template: Template) => void; // Callback to trigger editing
    }

    export const ViewTemplateModal: React.FC<ViewTemplateModalProps> = ({
      template,
      onClose,
      onEdit,
    }) => {
      return (
        <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 transform transition-all duration-300 scale-100 opacity-100">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">View Template</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-200">{template.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-200">{template.type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Prompt / Content</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-200 max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {template.prompt}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => onEdit(template)} // Call the onEdit callback
                className="inline-flex items-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </button>
            </div>
          </div>
        </div>
      );
    };
