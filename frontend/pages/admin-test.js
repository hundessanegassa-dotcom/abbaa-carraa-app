import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminTest() {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setStatus('Not logged in');
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, user_type')
      .eq('id', user.id)
      .maybeSingle();
    
    const { data: adminRecord } = await supabase
      .from('admins')
      .select('is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    
    setStatus(`
      Logged in as: ${user.email}
      Profile role: ${profile?.role}
      Profile user_type: ${profile?.user_type}
      Admin record exists: ${!!adminRecord}
      Is Admin: ${profile?.role === 'admin' && adminRecord ? 'YES ✅' : 'NO ❌'}
    `);
  }

  return (
    <div className="p-8">
      <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">
        {status}
      </pre>
    </div>
  );
}
