'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'technician'>('user');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), role }),
    });
    setLoading(false);
    if (!res.ok) return;
    router.push(role === 'technician' ? '/technician/dashboard' : '/');
  }

  return (
    <div className="max-w-sm mx-auto card p-6">
      <h1 className="text-xl font-semibold mb-1">Log in</h1>
      <p className="text-sm text-slate-500 mb-5">
        Demo auth — just a name, no password. Swap for real auth before launch.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          className="input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={role === 'user' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
          >
            I need a technician
          </button>
          <button
            type="button"
            onClick={() => setRole('technician')}
            className={role === 'technician' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
          >
            I'm a technician
          </button>
        </div>
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Logging in…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
