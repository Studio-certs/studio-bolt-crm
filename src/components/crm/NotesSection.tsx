import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Note } from '../types/crm';

interface NotesSectionProps {
  notes: Note[];
  newNote: string;
  onNoteChange: (note: string) => void;
  onAddNote: (e: React.FormEvent) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  notes,
  newNote,
  onNoteChange,
  onAddNote,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Notes</h2>
        <MessageSquare className="h-5 w-5 text-gray-400" />
      </div>
      
      <form onSubmit={onAddNote} className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Add a note..."
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={3}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Note
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="border-l-4 border-indigo-200 pl-3 py-2">
            <p className="text-sm text-gray-600">{note.content}</p>
            <p className="text-xs text-gray-400 mt-1">
              {note.creator.name} - {new Date(note.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};