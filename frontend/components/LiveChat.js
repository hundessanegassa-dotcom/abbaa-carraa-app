import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function LiveChat({ poolId, poolName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [participants, setParticipants] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (poolId) {
      fetchUser();
      fetchMessages();
      fetchParticipants();
      setupRealtimeSubscription();
    }
  }, [poolId]);

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      setUserProfile(profile);
    }
  }

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, profiles(full_name)')
      .eq('pool_id', poolId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (!error && data) {
      setMessages(data);
      scrollToBottom();
    }
  }

  async function fetchParticipants() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('chat_messages')
      .select('user_id', { distinct: true })
      .eq('pool_id', poolId)
      .gte('created_at', thirtyMinutesAgo);
    if (!error && data) {
      setParticipants(data.length);
    }
  }

  function setupRealtimeSubscription() {
    const subscription = supabase
      .channel(`chat:${poolId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `pool_id=eq.${poolId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        scrollToBottom();
        fetchParticipants();
      })
      .subscribe();
    return () => subscription.unsubscribe();
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!user) {
      toast.error('Please login to chat');
      return;
    }
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          pool_id: poolId,
          user_id: user.id,
          message: newMessage.trim()
        });
      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition"
      >
        {isOpen ? '✕' : '💬'}
        {participants > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {participants}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-200">
          <div className="bg-green-600 text-white p-3 rounded-t-lg flex justify-between">
            <span>💬 {poolName} Chat</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400">No messages yet. Be the first!</p>
            ) : (
              messages.map((msg, idx) => {
                const isOwn = msg.user_id === user?.id;
                return (
                  <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-2 ${isOwn ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {!isOwn && <p className="text-xs font-bold text-green-600">{msg.profiles?.full_name || 'User'}</p>}
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs text-gray-400 text-right">{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          {user ? (
            <form onSubmit={sendMessage} className="border-t p-2 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded-lg text-sm"
              />
              <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm">Send</button>
            </form>
          ) : (
            <div className="border-t p-2 text-center text-sm">Login to chat</div>
          )}
        </div>
      )}
    </>
  );
}
