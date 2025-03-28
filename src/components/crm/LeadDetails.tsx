import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Mail, Phone, Building2, DollarSign, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Lead } from '../../types/crm';
import { LeadChatter } from './LeadChatter';
import { TodoList } from './TodoList';

export const LeadDetails: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = React.useState<Lead | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
    }
  }, [leadId]);

  const fetchLeadDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('client_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) throw error;
      setLead(data);
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 w-6 mr-2 text-primary-600" />
                {lead.name}
              </h1>
              <p className="text-sm text-gray-500">{lead.company}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              lead.status === 'won' ? 'bg-success-50 text-success-700' :
              lead.status === 'lost' ? 'bg-danger-50 text-danger-700' :
              lead.status === 'proposal' ? 'bg-warning-50 text-warning-700' :
              'bg-gray-100 text-gray-800'
            }`}>
              {lead.status}
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <TodoList leadId={lead.id} />

            {/* Lead Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center text-sm mb-4">
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{lead.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm mb-4">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium">{lead.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="font-medium">{lead.company || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center text-sm mb-4">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Value</p>
                      <p className="font-medium">${lead.value?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm mb-4">
                    <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Source</p>
                      <p className="font-medium capitalize">{lead.source.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              </div>
              {lead.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>

            {/* Timeline or other sections can be added here */}
          </div>

          {/* Chatter Section */}
          <div className="lg:col-span-1">
            <LeadChatter leadId={lead.id} />
          </div>
        </div>
      </main>
    </div>
  );
};