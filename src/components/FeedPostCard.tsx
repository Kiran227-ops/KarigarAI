import Link from 'next/link';

interface FeedPost {
  id: string;
  content: string;
  image?: string | null;
  category: string;
  createdAt: string;
  solvedCount?: number;
  technician: {
    id: string;
    name: string;
    location?: string;
    rating?: number;
  };
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();

  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return 'just now';

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}

export default function FeedPostCard({
  post,
}: {
  post: FeedPost;
}) {
  const technicianName =
    post.technician.name || 'Unknown Technician';
  const categoryLabel = post.category || 'General Service';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/technician/${post.technician.id}`}
          className="flex items-center gap-3 group min-w-0"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-base font-semibold text-sky-700">
            {technicianName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-slate-900 group-hover:underline">
              {technicianName}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 font-medium text-sky-700">
                {categoryLabel}
              </span>

              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                ✅ {post.solvedCount ?? 0} solved
              </span>

              {post.technician.location && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span>📍</span>
                    <span>{post.technician.location}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>

        <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap">
          {timeAgo(post.createdAt)}
        </span>
      </div>

      <p className="mt-4 text-base leading-relaxed text-slate-700">
        {post.content}
      </p>

      {post.image && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img
            src={post.image}
            alt={`Work completed by ${technicianName}`}
            className="max-h-[420px] w-full object-cover"
          />
        </div>
      )}

      {post.technician.rating !== undefined && (
        <div className="mt-4 flex items-center gap-1 text-sm text-slate-600">
          <span>⭐</span>
          <span>{post.technician.rating.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}