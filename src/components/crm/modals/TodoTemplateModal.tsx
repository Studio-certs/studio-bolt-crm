import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { TodoTemplate } from '../../../types/crm';

interface TodoTemplateModalProps {
  templates: TodoTemplate[];
  onClose: () => void;
  onSelect: (template: TodoTemplate) => void;
}

export const TodoTemplateModal: React.FC<TodoTemplateModalProps> = ({
  templates,
  onClose,
  onSelect,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Choose a Template</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a template to create a structured todo list
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {templates.map((template) => (
            <button
              key={template.name}
              onClick={() => onSelect(template)}
              className="w-full text-left px-4 py-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 focus:outline-none transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-base font-medium text-gray-900">
                    {template.name}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {template.description}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {template.tasks.length} tasks
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};