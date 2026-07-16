// pages/admin/telegram-users.js
import { supabase } from '../../lib/supabase';

export default function TelegramUsers({ users }) {
  return (
    <div>
      <h1>Telegram Users</h1>
      <table>
        <thead>
          <tr>
            <th>Telegram ID</th>
            <th>Username</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Language</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.telegram_id}</td>
              <td>@{user.telegram_username}</td>
              <td>{user.full_name}</td>
              <td>{user.phone}</td>
              <td>{user.language}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function getServerSideProps() {
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .not('telegram_id', 'is', null)
    .order('created_at', { ascending: false });
  
  return { props: { users } };
}
