import React from 'react';
    import { useNavigate, useParams } from 'react-router-dom'; // Import useNavigate and useParams
    import { CheckSquare, Plus, ListTodo, Calendar } from 'lucide-react';
    import { supabase } from '../../lib/supabase';
    import { Todo, TodoTemplate } from '../../types/crm';
    import { TodoTemplateModal } from './modals/TodoTemplateModal';
    import { AddCustomTodoModal } from './modals/AddCustomTodoModal';
    import { useAuth } from '../../context/AuthContext';

    const TODO_TEMPLATES: TodoTemplate[] = [
      {
        name: 'Custom',
        description: 'Create your own custom tasks.',
        isCustom: true,
        tasks: []
      },
      {
        name: 'New Client Onboarding',
        description: 'This template helps ensure a smooth onboarding process for new clients.',
        tasks: [
          { title: 'Send Welcome Email', description: 'Include a personalized message and next steps.' },
          { title: 'Schedule Kickoff Meeting', description: 'Set a date and time for the initial meeting.' },
          { title: 'Collect Necessary Documents', description: 'Request contracts, agreements, or other required paperwork.' },
          { title: 'Set Up Client Profile in CRM', description: 'Add contact details, company information, and notes.' },
          { title: 'Assign Account Manager', description: 'Designate a point of contact for the client.' },
          { title: 'Follow Up After 7 Days', description: 'Check in to ensure the client is satisfied with the onboarding process.' }
        ]
      },
      {
        name: 'Lead Follow-Up',
        description: 'This template ensures no lead falls through the cracks.',
        tasks: [
          { title: 'Review Lead Details', description: 'Check lead source, interests, and previous interactions.' },
          { title: 'Send Initial Follow-Up Email', description: 'Personalize the message based on the lead\'s interests.' },
          { title: 'Schedule a Call or Meeting', description: 'Propose a time to discuss their needs.' },
          { title: 'Add Lead to Nurture Campaign', description: 'Assign them to an email sequence or drip campaign.' },
          { title: 'Set Reminder for Next Follow-Up', description: 'Schedule a follow-up if no response is received.' },
          { title: 'Update Lead Status in CRM', description: 'Mark as "Contacted," "Interested," or "Not Interested."' }
        ]
      },
      {
        name: 'Project Management',
        description: 'This template helps manage ongoing projects and tasks.',
        tasks: [
          { title: 'Define Project Scope', description: 'Outline goals, deliverables, and timelines.' },
          { title: 'Assign Tasks to Team Members', description: 'Break down the project into actionable steps.' },
          { title: 'Set Milestones and Deadlines', description: 'Track progress with key milestones.' },
          { title: 'Schedule Weekly Check-Ins', description: 'Review progress and address any roadblocks.' },
          { title: 'Update Client on Progress', description: 'Send a status report or schedule a call.' },
          { title: 'Conduct Project Retrospective', description: 'Evaluate what went well and what could be improved.' }
        ]
      },
      {
        name: 'Customer Support Escalation',
        description: 'This template ensures timely resolution of customer issues.',
        tasks: [
          { title: 'Acknowledge the Issue', description: 'Send an immediate response to the customer.' },
          { title: 'Investigate the Problem', description: 'Gather details and replicate the issue if possible.' },
          { title: 'Assign to the Right Team', description: 'Route the ticket to the appropriate department.' },
          { title: 'Provide Regular Updates', description: 'Keep the customer informed of progress.' },
          { title: 'Resolve the Issue', description: 'Implement a solution and confirm with the customer.' },
          { title: 'Follow Up After Resolution', description: 'Ensure the customer is satisfied and close the ticket.' }
        ]
      }
    ];

    interface TodoListProps {
      leadId: string;
    }

    export const TodoList: React.FC<TodoListProps> = ({ leadId }) => {
      const { state: { user } } = useAuth();
      const [todos, setTodos] = React.useState<Todo[]>([]);
      const [showTemplateModal, setShowTemplateModal] = React.useState(false);
      const [showCustomTodoModal, setShowCustomTodoModal] = React.useState(false);
      const [isLoading, setIsLoading] = React.useState(true);
      const navigate = useNavigate(); // Initialize useNavigate
      const { id: clientId } = useParams<{ id: string }>(); // Get clientId from params

      React.useEffect(() => {
        fetchTodos();
      }, [leadId]);

      const fetchTodos = async () => {
        try {
          setIsLoading(true);
          let query = supabase
            .from('lead_todos')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true });

          // If user is not admin, only show todos they created
          if (user?.role !== 'admin') {
            query = query.eq('created_by', user?.id);
          }

          const { data } = await query;
          if (data) setTodos(data);
        } catch (error) {
          console.error('Error fetching todos:', error);
        } finally {
          setIsLoading(false);
        }
      };

      const handleTemplateSelect = async (template: TodoTemplate) => {
        if (template.isCustom) {
          setShowTemplateModal(false);
          setShowCustomTodoModal(true);
          return;
        }

        const todosToInsert = template.tasks.map(task => ({
          lead_id: leadId,
          title: task.title,
          description: task.description,
          status: 'pending'
        }));

        const { error } = await supabase
          .from('lead_todos')
          .insert(todosToInsert);

        if (!error) {
          setShowTemplateModal(false);
          fetchTodos();
        }
      };

      // Remove toggleTodoStatus function

      const handleAddCustomTodo = async (todo: Partial<Todo>) => {
        const { error } = await supabase
          .from('lead_todos')
          .insert([{
            lead_id: leadId,
            ...todo
          }]);

        if (!error) {
          setShowCustomTodoModal(false);
          fetchTodos();
        }
      };

      // Function to handle navigation
      const handleTodoClick = (todoId: string) => {
        navigate(`/clients/${clientId}/crm/leads/${leadId}/todos/${todoId}`);
      };

      if (isLoading) {
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Todo List</h2>
              <p className="text-sm text-gray-500">Track and manage tasks for this lead</p>
            </div>
            {todos.length === 0 && (
              <button
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </button>
            )}
            {todos.length > 0 && (
              <button
                onClick={() => setShowCustomTodoModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </button>
            )}
          </div>

          {todos.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a template</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => handleTodoClick(todo.id)} // Add onClick handler
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors ${
                    todo.status === 'completed' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div // Use a div instead of button for the icon
                    className={`flex-shrink-0 mt-0.5 ${
                      todo.status === 'completed' ? 'text-green-500' : 'text-gray-400'
                    }`}
                  >
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      todo.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}>
                      {todo.title}
                    </p>
                    {todo.description && (
                      <p className={`mt-1 text-sm ${
                        todo.status === 'completed' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {todo.description}
                      </p>
                    )}
                    {todo.deadline && (
                      <div className="mt-2 flex items-center text-xs text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due: {new Date(todo.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showTemplateModal && (
            <TodoTemplateModal
              templates={TODO_TEMPLATES}
              onClose={() => setShowTemplateModal(false)}
              onSelect={handleTemplateSelect}
            />
          )}
          {showCustomTodoModal && (
            <AddCustomTodoModal
              onClose={() => setShowCustomTodoModal(false)}
              onSubmit={handleAddCustomTodo}
            />
          )}
        </div>
      );
    };
