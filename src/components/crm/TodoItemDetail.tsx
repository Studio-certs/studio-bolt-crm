import React from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { ArrowLeft, CheckCircle2, Circle, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
    import { supabase } from '../../lib/supabase';
    import { Todo } from '../../types/crm';
    import { TodoNotes } from './TodoNotes'; // Import the new component

    export const TodoItemDetail: React.FC = () => {
      const { todoId, leadId, id: clientId } = useParams<{ todoId: string; leadId: string; id: string }>();
      const navigate = useNavigate();
      const [todo, setTodo] = React.useState<Todo | null>(null);
      const [isLoading, setIsLoading] = React.useState(true);
      const [error, setError] = React.useState('');
      const [isUpdating, setIsUpdating] = React.useState(false);

      React.useEffect(() => {
        if (todoId) {
          fetchTodoDetails();
        }
      }, [todoId]);

      const fetchTodoDetails = async () => {
        try {
          setIsLoading(true);
          setError('');
          const { data, error: fetchError } = await supabase
            .from('lead_todos')
            .select('*')
            .eq('id', todoId)
            .single();

          if (fetchError) throw fetchError;
          setTodo(data);
        } catch (err) {
          console.error('Error fetching todo details:', err);
          setError('Failed to load todo details.');
        } finally {
          setIsLoading(false);
        }
      };

      const handleToggleStatus = async () => {
        if (!todo) return;

        const newStatus = todo.status === 'pending' ? 'completed' : 'pending';
        const updateData: Partial<Todo> = {
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        };

        try {
          setIsUpdating(true);
          setError('');
          const { error: updateError } = await supabase
            .from('lead_todos')
            .update(updateData)
            .eq('id', todo.id);

          if (updateError) throw updateError;

          // Refetch details to show updated status
          fetchTodoDetails();
        } catch (err) {
          console.error('Error updating todo status:', err);
          setError('Failed to update todo status.');
        } finally {
          setIsUpdating(false);
        }
      };

      if (isLoading) {
        return (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        );
      }

      if (error && !isLoading) { // Show error only if not loading
        return (
          <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
            <button
              onClick={() => navigate(`/clients/${clientId}/crm/leads/${leadId}`)}
              className="ml-auto inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          </div>
        );
      }

      if (!todo) {
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700">Todo Item Not Found</h2>
            <button
              onClick={() => navigate(`/clients/${clientId}/crm/leads/${leadId}`)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lead
            </button>
          </div>
        );
      }

      const isCompleted = todo.status === 'completed';

      return (
        <div className="space-y-6">
          <button
            onClick={() => navigate(`/clients/${clientId}/crm/leads/${leadId}`)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Lead Details
          </button>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{todo.title}</h1>
                <div className="mt-2 flex flex-wrap items-center text-sm gap-x-4 gap-y-2">
                  {isCompleted ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Circle className="h-4 w-4 mr-1" />
                      Pending
                    </span>
                  )}
                  {todo.deadline && (
                    <span className="flex items-center text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {new Date(todo.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleToggleStatus}
                disabled={isUpdating}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                  isCompleted
                    ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {isUpdating ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isCompleted ? (
                  <RefreshCw className="h-5 w-5 mr-2" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                )}
                {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
              </button>
            </div>

            {todo.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{todo.description}</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500">
              <p>Created: {new Date(todo.created_at).toLocaleString()}</p>
              {todo.completed_at && (
                <p>Completed: {new Date(todo.completed_at).toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <TodoNotes todoId={todo.id} />
          </div>
        </div>
      );
    };
