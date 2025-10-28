// pages/Admin/AdminPage.tsx
import { useState } from 'react';
import { AuthApi } from '../../api/authApi';

export default function AdminPage() {
  const [form, setForm] = useState({ username:'', email:'', password:'' });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await AuthApi.createUser(form);
    alert(`User created: ${res.id}`);
  };
  return (
    <section>
      <h2>Admin</h2>
      <form onSubmit={submit} style={{ display:'grid', gap:8, maxWidth:400 }}>
        <input placeholder="username" value={form.username} onChange={e => setForm({ ...form, username:e.target.value })}/>
        <input placeholder="email" value={form.email} onChange={e => setForm({ ...form, email:e.target.value })}/>
        <input placeholder="password" type="password" value={form.password} onChange={e => setForm({ ...form, password:e.target.value })}/>
        <button type="submit">Create user</button>
      </form>
    </section>
  );
}
