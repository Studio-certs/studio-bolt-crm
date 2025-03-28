import React from 'react';
import { Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface ChatterMessage {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  profiles: {
    name: string;
    avatar_url: string;
  };
}

interface LeadChatterProps {
  leadId: string;
}

export const LeadChatter: React.FC<LeadChatterProps> = ({ leadId }) => {
  const { state: { user } } = useAuth();
  const [messages, setMessages] = React.useState<ChatterMessage[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const channel = React.useRef<ReturnType<typeof supabase.channel>>();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetchMessages();
    setupSubscription();
    
    return () => {
      if (channel.current) {
        supabase.removeChannel(channel.current);
      }
    };
  }, [leadId]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupSubscription = () => {
    if (channel.current) {
      supabase.removeChannel(channel.current);
    }

    channel.current = supabase
      .channel(`lead_chatter:${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_chatter',
          filter: `lead_id=eq.${leadId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('lead_chatter')
      .select(`
        id,
        content,
        created_at,
        created_by,
        profiles (
          name,
          avatar_url
        )
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const subscribeToMessages = () => {
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
      .from('lead_chatter')
      .insert([{
        lead_id: leadId,
        content: newMessage,
      }]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg flex flex-col h-[calc(100vh-12rem)]">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Chatter</h2>
        <p className="text-sm text-gray-500">Team communication about this lead</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.created_by === user?.id ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-medium text-indigo-800">
                  {message.profiles.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className={`flex flex-col ${
              message.created_by === user?.id ? 'items-end' : ''
            }`}>
              <div className={`rounded-lg px-4 py-2 max-w-sm ${
                message.created_by === user?.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {message.profiles.name} • {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};