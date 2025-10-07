// useServiceSearch.js
import { useState, useEffect } from 'react';

export default function useServiceSearch(initialQuery = '', delay = 350) {
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), delay);
    return () => clearTimeout(t);
  }, [query, delay]);

  return { query, setQuery, debounced };
}
