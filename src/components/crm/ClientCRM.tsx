@@ .. @@
 import React from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import { ClientHeader } from './crm/ClientHeader';
 import { ContactInfo } from './crm/ContactInfo';
 import { NotesSection } from './crm/NotesSection';
 import { MeetingsSection } from './crm/MeetingsSection';
 import { LeadsSection } from './crm/LeadsSection';
-import { supabase } from '../lib/supabase';
-import { Lead, Note, Meeting } from '../types/crm';
+import { supabase } from '../../lib/supabase';
+import { Lead, Note, Meeting } from '../../types/crm';
 
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
 }
 
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
