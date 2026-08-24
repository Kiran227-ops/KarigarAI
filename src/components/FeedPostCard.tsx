'use client';

interface FeedPost {
  id: string;
  content: string;
  image?: string | null;
  category: string;
  createdAt?: string | Date;
  technician: {
    id: string;
    name: string;
    location?: string;
    rating?: number;
  };
}

export default function FeedPostCard({
  post,
}: {
  post: FeedPost;
}) {
  const { technician } = post;

  return (
    <article className="card p-5 flex flex-col gap-4">

      {/* Technician information */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">

          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-semibold">
            {technician.name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              {technician.name}
            </h2>

            <p className="text-sm text-slate-500">
              {post.category}

              {technician.location && (
                <>
                  {' '}•{' '}
                  {technician.location}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Time */}
        {post.createdAt && (
          <span className="text-xs text-slate-400">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Post content */}
      <p className="text-[15px] leading-7 text-slate-700">
        {post.content}
      </p>

      {/* ⭐ POST IMAGE */}
      {post.image && (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200">
          <img
            src={post.image}
            alt="Image shared by technician"
            className="w-full max-h-[600px] object-cover"
          />
        </div>
      )}

      {/* Rating */}
      {typeof technician.rating === 'number' && (
        <div className="text-sm text-slate-500">
          ⭐ {technician.rating.toFixed(1)}
        </div>
      )}

    </article>
  );
}