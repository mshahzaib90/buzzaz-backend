import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to update the document title.
 * @param {string} title - The title to set.
 * @param {boolean} exact - If true, sets the title exactly as provided. If false (default), prepends "Buzzaz | ".
 */
const usePageTitle = (title, exact = false) => {
  const location = useLocation();

  useEffect(() => {
    if (!title) return;
    
    const formattedTitle = exact ? title : `Buzzaz | ${title}`;
    document.title = formattedTitle;
    
    // Cleanup is intentionally omitted to persist title until next change
  }, [title, exact, location]);
};

export default usePageTitle;
