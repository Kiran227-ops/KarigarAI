'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import ResultCard from '@/components/ResultCard';

interface SearchResponse {
  understanding: {
    problem: string;
    device: string;
    symptoms: string[];
    category: string;
  };
  results: any[];
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem: q,
      }),
    })
      .then(async (res) => {
        const body = await res.json();

        if (!res.ok) {
          throw new Error(body.error || 'Search failed');
        }

        setData(body);
      })
      .catch((err) => {
        setError(err.message || 'Search failed');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [q]);

  return (
    <div className="flex flex-col gap-6">
      <SearchBar initialValue={q} />

      {loading && (
        <p className="text-slate-500 text-sm">
          Understanding your problem and searching…
        </p>
      )}

      {error && (
        <p className="text-red-600 text-sm">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="text-sm text-slate-500">
            Understood as:{' '}
            <span className="text-slate-700">
              {data.understanding.category}
            </span>

            {data.understanding.symptoms.length > 0 && (
              <>
                {' '}— {data.understanding.symptoms.join(', ')}
              </>
            )}
          </div>

          <h2 className="font-semibold text-slate-900">
            People who solved similar problems
          </h2>

          {data.results.length === 0 ? (
            <p className="text-sm text-slate-500">
              No matching technician experiences yet. Try a
              different description, or check back once more
              technicians have posted.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {data.results.map((r, i) => (
                <ResultCard
                  key={r.post?.id ?? i}
                  result={r}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-slate-500">
        Loading search...
      </p>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchResultsContent />
    </Suspense>
  );
}