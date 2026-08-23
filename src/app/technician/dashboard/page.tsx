'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PostForm from '@/components/PostForm';
import type { Session } from '@/lib/session';

interface Profile {
  category: string;
  location: string;
  skills: string[];
  bio: string;
}

interface PostItem {
  _id: string;
  content: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile>({ category: '', location: '', skills: [], bio: '' });
  const [skillsInput, setSkillsInput] = useState('');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        setSession(d.session);
        if (!d.session || d.session.role !== 'technician') {
          router.replace('/login');
        }
      });
  }, [router]);

  useEffect(() => {
    if (session?.role === 'technician') {
      loadPosts(session.id);
    }
  }, [session]);

  async function loadPosts(technicianId: string) {
    const res = await fetch(`/api/posts?technicianId=${technicianId}`);
    const data = await res.json();
    setPosts(data.posts || []);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/technicians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...profile,
        skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
  }

  if (!session) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="card p-6">
        <h1 className="text-lg font-semibold mb-4">Your technician profile</h1>
        <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
          <input
            className="input"
            placeholder="Service category (e.g. AC Technician)"
            value={profile.category}
            onChange={(e) => setProfile({ ...profile, category: e.target.value })}
          />
          <input
            className="input"
            placeholder="Location (e.g. Hyderabad)"
            value={profile.location}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          />
          <input
            className="input sm:col-span-2"
            placeholder="Skills, comma separated (e.g. AC repair, condensate drain, gas refill)"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
          />
          <textarea
            className="input sm:col-span-2"
            placeholder="Short bio (optional)"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
          <button className="btn-primary sm:col-span-2 self-start" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Post a problem you solved</h2>
        <PostForm onPosted={() => loadPosts(session.id)} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Your posts</h2>
        <div className="flex flex-col gap-3">
          {posts.length === 0 && <p className="text-sm text-slate-500">No posts yet.</p>}
          {posts.map((p) => (
            <div key={p._id} className="card p-4 text-sm text-slate-700">
              {p.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
