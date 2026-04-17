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
  const chatContainerRef = useRef(null);

  useEffect(() => {
    fetchUser();
    fetchMessages();
    fetchParticipants();
    setupRealtimeSubscription();

    return () => {
      supabase.removeAllChannels();
    };
  }, [poolId]);

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
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
    // Get unique users who sent messages in last 30 minutes
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
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all"
      >
        {isOpen ? '✕' : '💬'}
        {participants > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {participants}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-4 w-96 h-[500px] bg-white rounded-lg shadow-xl z-50 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-green-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <div>
              <span className="font-semibold">💬 {poolName} Chat</span>
              <span className="text-xs ml-2 opacity-75">{participants} online</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                No messages yet. Be the first to say hello!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isOwn = msg.user_id === user?.id;
                return (
                  <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwn ? 'bg-green-100' : 'bg-gray-100'} rounded-lg p-2`}>
                      {!isOwn && (
                        <p className="text-xs font-bold text-green-600 mb-1">
                          {msg.profiles?.full_name || 'Anonymous'}
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {user ? (
            <form onSubmit={sendMessage} className="border-t p-3 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="border-t p-3 text-center text-gray-500">
              <a href="/login" className="text-green-600">Login</a> to join the chat
            </div>
          )}
        </div>
      )}
    </>
  );
}
