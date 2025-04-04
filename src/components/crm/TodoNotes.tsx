import React from 'react';
    import { MessageSquare, Send, AlertCircle } from 'lucide-react';
    import { supabase } from '../../lib/supabase';
    import { useAuth } from '../../context/AuthContext';

    interface TodoNote {
      id: string;
      content: string;
      created_at: string;
      created_by: string;
      profiles: {
        name: string;
      };
    }

    interface TodoNotesProps {
      todoId: string;
    }

    export const TodoNotes: React.FC<TodoNotesProps> = ({ todoId }) => {
      const { state: { user } } = useAuth();
      const [notes, setNotes] = React.useState<TodoNote[]>([]);
      const [newNote, setNewNote] = React.useState('');
      const [isLoading, setIsLoading] = React.useState(true);
      const [error, setError] = React.useState('');

      React.useEffect(() => {
        fetchNotes();
      }, [todoId]);

      const fetchNotes = async () => {
        try {
          setIsLoading(true);
          setError('');
          const { data, error: fetchError } = await supabase
            .from('lead_todo_notes')
            .select(`
              id,
              content,
              created_at,
              created_by,
              profiles (
                name
              )
            `)
            .eq('todo_id', todoId)
            .order('created_at', { ascending: false });

          if (fetchError) throw fetchError;
          setNotes(data || []);
        } catch (err) {
          console.error('Error fetching todo notes:', err);
          setError('Failed to load notes');
        } finally {
          setIsLoading(false);
        }
      };

      const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
          setError('');
          const { error: insertError } = await supabase
            .from('lead_todo_notes')
            .insert([{
              todo_id: todoId,
              content: newNote.trim()
            }]);

          if (insertError) throw insertError;

          setNewNote('');
          fetchNotes(); // Refetch notes after adding
        } catch (err) {
          console.error('Error adding todo note:', err);
          setError('Failed to add note');
        }
      };

      if (isLoading) {
        return (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Notes</h2>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note for this task..."
              rows={3}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newNote.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                Add Note
              </button>
            </div>
          </form>

          {notes.length === 0 && !isLoading ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notes yet</h3>
              <p className="mt-1 text-sm text-gray-500">Add the first note for this task.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <span>{note.profiles?.name || 'Unknown User'}</span>
                    <span className="mx-1">•</span>
                    <span>{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };
