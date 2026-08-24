import Link from 'next/link';

interface FeedPost {
  id: string;
  content: string;
  image?: string | null;
  category: string;
  createdAt: string;
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

  return (
    <div className="card p-5 flex flex-col gap-3">

      {/* Technician Header */}
      <div className="flex items-start justify-between gap-3">

        <Link
          href={`/technician/${post.technician.id}`}
          className="flex items-center gap-3 group"
        >
          {/* Profile Initial */}
          <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-semibold">
            {technicianName.charAt(0).toUpperCase()}
          </div>

          {/* Technician Info */}
          <div>
            <div className="font-semibold text-slate-900 group-hover:underline">
              {technicianName}
            </div>

            <div className="text-xs text-slate-500">
              {post.category}

              {post.technician.location
                ? ` · 📍 ${post.technician.location}`
                : ''}
            </div>
          </div>
        </Link>

        {/* Time */}
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {timeAgo(post.createdAt)}
        </span>
      </div>

      {/* Post Content */}
      <p className="text-sm text-slate-700 leading-relaxed">
        {post.content}
      </p>

      {/* ⭐ POST IMAGE */}
      {post.image && (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
          <img
            src={post.image}
            alt={`Work completed by ${technicianName}`}
            className="w-full max-h-[500px] object-cover"
          />
        </div>
      )}

      {/* Rating */}
      {post.technician.rating !== undefined && (
        <div className="text-xs text-slate-500">
          ⭐ {post.technician.rating.toFixed(1)}
        </div>
      )}

    </div>
  );
}