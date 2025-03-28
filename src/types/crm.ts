export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: 'referral' | 'website' | 'cold_call' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  value: number;
  notes: string;
  created_at: string;
}

export interface Todo {
  id: string;
  lead_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  deadline?: string;
  deadline_reminder?: boolean;
  created_at: string;
  completed_at?: string;
}

export interface TodoTemplate {
  name: string;
  description: string;
  isCustom?: boolean;
  tasks: {
    title: string;
    description: string;
  }[];
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  creator: {
    name: string;
  };
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}