import Link from 'next/link';

interface FeedPost {
  id: string;
  content: string;
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
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedPostCard({ post }: { post: FeedPost }) {
  const technicianName = post.technician.name || 'Unknown Technician';

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/technician/${post.technician.id}`} className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-semibold">
            {technicianName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900 group-hover:underline">
              {technicianName}
            </div>
            <div className="text-xs text-slate-500">
              {post.category}
              {post.technician.location ? ` · 📍 ${post.technician.location}` : ''}
            </div>
          </div>
        </Link>
        <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(post.createdAt)}</span>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>

      {post.technician.rating && (
        <div className="text-xs text-slate-500">⭐ {post.technician.rating.toFixed(1)}</div>
      )}
    </div>
  );
}