import React from 'react';
import { Send, MessageSquare } from 'lucide-react';
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
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const pollingInterval = React.useRef<NodeJS.Timeout>();
  const messageIds = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    fetchMessages();
    startPolling();

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [leadId]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startPolling = () => {
    // Poll every 3 seconds
    pollingInterval.current = setInterval(checkNewMessages, 3000);
  };

  const addMessages = (newMessages: ChatterMessage[]) => {
    const uniqueNewMessages = newMessages.filter(msg => !messageIds.current.has(msg.id));
    
    if (uniqueNewMessages.length > 0) {
      uniqueNewMessages.forEach(msg => messageIds.current.add(msg.id));
      setMessages(prev => [...prev, ...uniqueNewMessages]);
    }
  };

  const checkNewMessages = async () => {
    try {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return;

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
        .gt('created_at', lastMessage.created_at)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        addMessages(data);
      }
    } catch (error) {
      console.error('Error checking new messages:', error);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
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

      if (data) {
        messageIds.current = new Set(data.map(msg => msg.id));
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lead_chatter')
        .insert([{
          lead_id: leadId,
          content: newMessage,
        }])
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
        .single();

      if (error) throw error;

      if (data) {
        messageIds.current.add(data.id);
        setMessages(prev => [...prev, data]);
      }
      setNewMessage('');
      scrollToBottom();
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
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
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
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {message.profiles.name} • {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
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
            disabled={!newMessage.trim()}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};