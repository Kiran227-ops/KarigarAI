import FeedPostCard from '@/components/FeedPostCard';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import TechnicianProfile from '@/lib/models/TechnicianProfile';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  await connectDB();

  const posts = await Post.find({}, { embedding: 0 }).sort({ createdAt: -1 }).lean();

  const technicianIds = [...new Set(posts.map((p: any) => p.technicianId))];
  const profiles = await TechnicianProfile.find({ userId: { $in: technicianIds } }).lean();
  const profileByUserId = new Map(profiles.map((p: any) => [p.userId, p]));

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Feed</h1>
        <p className="text-sm text-slate-500">
          Every problem technicians on FixMatch have posted about, newest first.
        </p>
      </div>

      {posts.length === 0 && (
        <p className="text-sm text-slate-500">
          No posts yet — technicians haven't shared any solved problems. Run{' '}
          <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">npm run seed</code> for demo
          data, or log in as a technician and post one.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {posts.map((p: any) => {
          const profile = profileByUserId.get(p.technicianId);
          return (
            <FeedPostCard
              key={String(p._id)}
              post={{
                id: String(p._id),
                content: p.content,
                category: p.category,
                createdAt: p.createdAt,
                technician: {
                  id: p.technicianId,
                  name: profile?.name ?? p.technicianName,
                  location: profile?.location ?? p.location,
                  rating: profile?.rating,
                },
              }}
            />
          );
        })}
      </div>
    </div>
  );
}