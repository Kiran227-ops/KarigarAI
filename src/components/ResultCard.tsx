import Link from 'next/link';

interface Result {
  relevanceLabel: string;

  post: {
    id?: string;
    content: string;
    category: string;
    image?: string | null;
    createdAt?: string;
  };

  technician: {
    id: string;
    name: string;
    category: string;
    location?: string;
    rating?: number;
  };
}

export default function ResultCard({
  result,
}: {
  result: Result;
}) {
  const { relevanceLabel, post, technician } = result;

  return (
    <div className="card p-5 flex flex-col gap-3">

      {/* ================================================= */}
      {/* TECHNICIAN HEADER */}
      {/* ================================================= */}

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-900">
            🔧 {technician.name}
          </div>

          <div className="text-sm text-slate-500">
            {technician.category}
            {technician.location
              ? ` · 📍 ${technician.location}`
              : ''}
          </div>
        </div>

        {/* Match label */}
        <span className="text-xs font-medium bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full whitespace-nowrap">
          {relevanceLabel}
        </span>
      </div>

      {/* ================================================= */}
      {/* POST IMAGE */}
      {/* ================================================= */}

      {post.image && (
        <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <img
            src={post.image}
            alt={`Work completed by ${technician.name}`}
            className="w-full max-h-[420px] object-cover"
          />
        </div>
      )}

      {/* ================================================= */}
      {/* PROBLEM DESCRIPTION */}
      {/* ================================================= */}

      <blockquote className="text-sm text-slate-700 border-l-2 border-slate-200 pl-3 italic">
        "{post.content}"
      </blockquote>

      {/* ================================================= */}
      {/* RATING + LOCATION */}
      {/* ================================================= */}

      <div className="flex items-center gap-4 text-sm text-slate-500">
        {technician.rating !== undefined && (
          <span>
            ⭐ {technician.rating.toFixed(1)}
          </span>
        )}

        {technician.location && (
          <span>
            📍 {technician.location}
          </span>
        )}
      </div>

      {/* ================================================= */}
      {/* PROFILE BUTTON */}
      {/* ================================================= */}

      <Link
        href={`/technician/${technician.id}`}
        className="btn-secondary text-center mt-1"
      >
        View Profile
      </Link>

    </div>
  );
}