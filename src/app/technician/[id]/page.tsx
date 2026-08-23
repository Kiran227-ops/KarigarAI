import { connectDB } from '@/lib/db';
import TechnicianProfile from '@/lib/models/TechnicianProfile';
import Post from '@/lib/models/Post';
import { notFound } from 'next/navigation';

export default async function TechnicianProfilePage({ params }: { params: { id: string } }) {
  await connectDB();

  const profile = await TechnicianProfile.findOne({ userId: params.id }).lean();
  if (!profile) notFound();

  const posts = await Post.find({ technicianId: params.id }, { embedding: 0 })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6">
        <h1 className="text-xl font-semibold">🔧 {(profile as any).name}</h1>
        <p className="text-slate-500">{(profile as any).category}</p>
        <div className="flex gap-4 text-sm text-slate-500 mt-2">
          <span>⭐ {(profile as any).rating?.toFixed(1)}</span>
          <span>📍 {(profile as any).location}</span>
        </div>
        {(profile as any).bio && <p className="mt-3 text-sm text-slate-700">{(profile as any).bio}</p>}
        {(profile as any).skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {(profile as any).skills.map((s: string) => (
              <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}
        <a
          href={`mailto:contact@example.com?subject=Contact via FixMatch`}
          className="btn-primary inline-block mt-4"
        >
          Contact / Connect
        </a>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Problems solved</h2>
        <div className="flex flex-col gap-3">
          {posts.length === 0 && <p className="text-sm text-slate-500">No posts yet.</p>}
          {posts.map((p: any) => (
            <div key={String(p._id)} className="card p-4 text-sm text-slate-700">
              {p.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
