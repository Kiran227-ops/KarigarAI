'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
      <input
        className="input"
        placeholder="e.g. My AC is running but the room isn't cooling and water is leaking inside"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="btn-primary whitespace-nowrap" type="submit">
        Find a technician
      </button>
    </form>
  );
}
