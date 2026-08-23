'use client';

import { useState } from 'react';

export default function PostForm({ onPosted }: { onPosted?: () => void }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post');
      setContent('');
      onPosted?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <textarea
        className="input min-h-[110px]"
        placeholder='e.g. "Fixed a 15L geyser that wasn\'t heating water — the heating element had failed, so I replaced it."'
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary self-start" disabled={loading || content.trim().length < 10}>
        {loading ? 'Posting…' : 'Post experience'}
      </button>
    </form>
  );
}
