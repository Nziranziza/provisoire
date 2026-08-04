import { useState } from 'react';

/**
 * Minimal React island proving the @astrojs/react integration hydrates.
 * The practice engine (issue: practice page) replaces this.
 */
export default function IslandSmokeTest() {
  const [count, setCount] = useState(0);

  return (
    <button
      type="button"
      className="rounded-lg bg-slate-900 px-4 py-2 text-white"
      onClick={() => setCount((c) => c + 1)}
    >
      Hydrated: {count}
    </button>
  );
}
