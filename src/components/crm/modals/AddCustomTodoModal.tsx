import React from 'react';
import { X } from 'lucide-react';
import { Todo } from '../../../types/crm';

interface AddCustomTodoModalProps {
  onClose: () => void;
  onSubmit: (todo: Partial<Todo>) => void;
}

export const AddCustomTodoModal: React.FC<AddCustomTodoModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [todo, setTodo] = React.useState<Partial<Todo>>({
    title: '',
    description: '',
    deadline: undefined,
    deadline_reminder: false,
    status: 'pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(todo);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Add Custom Task</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a new task with custom details
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              required
              value={todo.title}
              onChange={(e) => setTodo({ ...todo, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={todo.description}
              onChange={(e) => setTodo({ ...todo, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Deadline
            </label>
            <input
              type="datetime-local"
              value={todo.deadline}
              onChange={(e) => setTodo({ ...todo, deadline: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="deadline_reminder"
              checked={todo.deadline_reminder}
              onChange={(e) => setTodo({ ...todo, deadline_reminder: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="deadline_reminder" className="ml-2 block text-sm text-gray-700">
              Enable deadline reminder
            </label>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};