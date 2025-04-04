import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientHeader } from './crm/ClientHeader';
import { ContactInfo } from './crm/ContactInfo';
import { NotesSection } from './crm/NotesSection';
import { MeetingsSection } from './crm/MeetingsSection';
import { LeadsSection } from './crm/LeadsSection';
import { supabase } from '../lib/supabase';
import { Lead, Note, Meeting } from '../types/crm';

export const ClientCRM: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = React.useState<any>(null);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [meetings, setMeetings] = React.useState<Meeting[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [newNote, setNewNote] = React.useState('');
  const [showAddMeeting, setShowAddMeeting] = React.useState(false);
  const [showAddLead, setShowAddLead] = React.useState(false);
  const [newMeeting, setNewMeeting] = React.useState({
    title: '',
    date: '',
    notes: '',
    status: 'scheduled' as const
  });

  const [newLead, setNewLead] = React.useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'other',
    status: 'new',
    value: undefined,
    notes: ''
  });

  React.useEffect(() => {
    if (id) {
      fetchClientDetails();
      fetchNotes();
      fetchMeetings();
      fetchLeads();
    }
  }, [id]);

  const fetchClientDetails = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (data) setClient(data);
  };

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('client_notes')
      .select(`
        id,
        content,
        created_at,
        created_by,
        creator:profiles!client_notes_created_by_fkey (
          name
        )
      `)
      .eq('client_id', id)
      .order('created_at', { ascending: false });
    if (data) setNotes(data);
  };

  const fetchMeetings = async () => {
    const { data } = await supabase
      .from('client_meetings')
      .select('*')
      .eq('client_id', id)
      .order('date', { ascending: true });
    if (data) setMeetings(data);
  };

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('client_leads')
      .select(`
        *,
        pending_tasks:lead_todos(count),
        last_activity:lead_chatter(created_at)
      `)
      .eq('client_id', id)
      .eq('lead_todos.status', 'pending')
      .order('created_at', { ascending: false });
    if (data) {
      const leadsWithMeta = data.map(lead => ({
        ...lead,
        pending_tasks: lead.pending_tasks?.[0]?.count || 0,
        last_activity: lead.last_activity?.[0]?.created_at || lead.updated_at
      }));
      setLeads(leadsWithMeta);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const { error } = await supabase
      .from('client_notes')
      .insert([{
        client_id: id,
        content: newNote,
      }]);

    if (!error) {
      setNewNote('');
      fetchNotes();
    }
  };

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('client_meetings')
      .insert([{
        client_id: id,
        ...newMeeting
      }]);

    if (!error) {
      setShowAddMeeting(false);
      setNewMeeting({
        title: '',
        date: '',
        notes: '',
        status: 'scheduled'
      });
      fetchMeetings();
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('client_leads')
      .insert([{
        client_id: id,
        ...newLead
      }]);

    if (!error) {
      setShowAddLead(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'other',
        status: 'new',
        value: undefined,
        notes: ''
      });
      fetchLeads();
    }
  };

  if (!client) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <ClientHeader client={client} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ContactInfo client={client} />
          
          <NotesSection
            notes={notes}
            newNote={newNote}
            onNoteChange={setNewNote}
            onAddNote={handleAddNote}
          />

          <MeetingsSection
            meetings={meetings}
            showAddMeeting={showAddMeeting}
            onShowAddMeeting={setShowAddMeeting}
            onAddMeeting={handleAddMeeting}
            newMeeting={newMeeting}
            onMeetingChange={setNewMeeting}
          />

          <LeadsSection
            leads={leads}
            showAddLead={showAddLead}
            onShowAddLead={setShowAddLead}
            onAddLead={handleAddLead}
            newLead={newLead}
            onLeadChange={setNewLead}
          />
        </div>
      </main>
    </div>
  );
};
