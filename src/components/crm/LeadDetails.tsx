import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Mail, 
  Phone, 
  Building2, 
  DollarSign, 
  MessageSquare,
  Edit3,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Lead } from '../../types/crm';
import { LeadChatter } from './LeadChatter';
import { TodoList } from './TodoList';
import { LeadNotes } from './LeadNotes';
import { useAuth } from '../../context/AuthContext';

export const LeadDetails: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { state: { user } } = useAuth();
  const [lead, setLead] = React.useState<Lead | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedLead, setEditedLead] = React.useState<Partial<Lead>>({});
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

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
      setEditedLead(data);
    } catch (error) {
      console.error('Error fetching lead:', error);
      setError('Error loading lead details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');

      if (!editedLead.name || !editedLead.email) {
        setError('Name and email are required');
        return;
      }

      const { error: updateError } = await supabase
        .from('client_leads')
        .update({
          name: editedLead.name,
          email: editedLead.email,
          phone: editedLead.phone,
          company: editedLead.company,
          source: editedLead.source,
          status: editedLead.status,
          value: editedLead.value,
          notes: editedLead.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      setSuccess('Lead updated successfully');
      setIsEditing(false);
      fetchLeadDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating lead');
    }
  };

  const canEdit = () => {
    if (!lead || !user) return false;
    return user.role === 'admin' || lead.created_by === user.id;
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-gray-500"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Users className="h-6 w-6 mr-2 text-primary-600" />
                  {lead?.name}
                </h1>
                <p className="text-sm text-gray-500">{lead?.company}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              lead?.status === 'won' ? 'bg-green-100 text-green-800' :
              lead?.status === 'lost' ? 'bg-red-100 text-red-800' :
              lead?.status === 'proposal' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {lead?.status}
            </span>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`rounded-lg p-4 ${
            error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            <div className="flex">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error || success}</span>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <TodoList leadId={lead?.id || ''} />

            {/* Lead Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Lead Information</h2>
                {!isEditing && canEdit() && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Lead
                  </button>
                )}
                {isEditing && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedLead(lead || {});
                        setError('');
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center text-sm mb-4">
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Email</p>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editedLead.email}
                          onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <p className="font-medium">{lead.email || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-sm mb-4">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Phone</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedLead.phone}
                          onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <p className="font-medium">{lead.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Company</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedLead.company}
                          onChange={(e) => setEditedLead({ ...editedLead, company: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <p className="font-medium">{lead.company || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center text-sm mb-4">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Value</p>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedLead.value}
                          onChange={(e) => setEditedLead({ ...editedLead, value: parseFloat(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <p className="font-medium">${lead.value?.toLocaleString() || '0'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-sm mb-4">
                    <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Source</p>
                      {isEditing ? (
                        <select
                          value={editedLead.source}
                          onChange={(e) => setEditedLead({ ...editedLead, source: e.target.value as Lead['source'] })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="referral">Referral</option>
                          <option value="website">Website</option>
                          <option value="cold_call">Cold Call</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <p className="font-medium capitalize">{lead.source.replace('_', ' ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {(isEditing || lead.notes) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                  {isEditing ? (
                    <textarea
                      value={editedLead.notes}
                      onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Lead Notes Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Notes</h2>
              <LeadNotes leadId={lead?.id || ''} />
            </div>
          </div>

          {/* Chatter Section */}
          <div className="lg:col-span-1">
            <LeadChatter leadId={lead?.id || ''} />
          </div>
        </div>
      </main>
    </div>
  );
};