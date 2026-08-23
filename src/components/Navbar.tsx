'use client';

import type { Session } from '@/lib/session';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setSession(d.session))
      .catch(() => setSession(null));
  }, []);

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    setSession(null);
    window.location.href = '/';
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg text-slate-900">
          Fix<span className="text-brand-600">Match</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
  <Link href="/feed" className="text-slate-600 hover:text-slate-900">
    Feed
  </Link>
  {session?.role === 'technician' && (
            <Link href="/technician/dashboard" className="text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
          )}
          {session ? (
            <>
              <span className="text-slate-500">
                {session.name} <span className="text-slate-400">({session.role})</span>
              </span>
              <button onClick={logout} className="text-slate-600 hover:text-slate-900">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary !px-4 !py-2 text-sm">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
