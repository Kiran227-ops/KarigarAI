import SearchBar from '@/components/SearchBar';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 max-w-2xl">
        People know what's wrong.
        <br />
        They don't always know who can fix it.
      </h1>
      <p className="text-slate-600 max-w-xl">
        Describe your problem in your own words. We'll match you with technicians who have
        solved similar problems before — based on their real write-ups, not a category dropdown.
      </p>

      <div className="w-full max-w-2xl">
        <SearchBar />
      </div>

      <p className="text-xs text-slate-400 max-w-md">
        These technicians have demonstrated experience solving similar problems — this isn't a
        guarantee of diagnosis or repair.
      </p>
    </div>
  );
}
