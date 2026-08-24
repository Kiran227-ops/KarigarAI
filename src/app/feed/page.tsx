import Link from 'next/link';

import FeedPostCard from '@/components/FeedPostCard';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import TechnicianProfile from '@/lib/models/TechnicianProfile';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  await connectDB();

  const posts = await Post.find(
    {},
    { embedding: 0 }
  )
    .sort({ createdAt: -1 })
    .lean();

  const technicianIds = [
    ...new Set(posts.map((p: any) => p.technicianId)),
  ];

  const profiles = await TechnicianProfile.find({
    userId: { $in: technicianIds },
  }).lean();

  const profileByUserId = new Map(
    profiles.map((p: any) => [p.userId, p])
  );

  const solvedCountByTechnician = posts.reduce(
    (acc: Record<string, number>, post: any) => {
      const technicianId = String(post.technicianId);
      acc[technicianId] = (acc[technicianId] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          aria-label="Go back to home"
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </Link>
      </div>

      {/* Feed Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Feed
        </h1>

        <p className="text-sm text-slate-500">
          Every problem technicians on FixMatch have posted about,
          newest first.
        </p>
      </div>

      {/* No Posts */}
      {posts.length === 0 && (
        <p className="text-sm text-slate-500">
          No posts yet — technicians haven't shared any solved
          problems. Run{' '}
          <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
            npm run seed
          </code>{' '}
          for demo data, or log in as a technician and post one.
        </p>
      )}

      {/* Posts */}
      <div className="flex flex-col gap-4">
        {posts.map((p: any) => {
          const profile = profileByUserId.get(p.technicianId);

          return (
            <FeedPostCard
              key={String(p._id)}
              post={{
                id: String(p._id),

                content: p.content,

                image: p.image ?? null,

                category: p.category,

                createdAt: p.createdAt,

                solvedCount:
                  solvedCountByTechnician[String(p.technicianId)] || 0,

                technician: {
                  id: p.technicianId,
                  name:
                    profile?.name ??
                    p.technicianName ??
                    'Unknown Technician',

                  location:
                    profile?.location ??
                    p.location,

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