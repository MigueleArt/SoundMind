import { useState, useEffect } from 'react';

export type Route = 'home' | 'questionnaire' | 'search' | 'results' | 'profile';

export function useRouter(initialRoute: Route = 'home') {
  const [currentPath, setCurrentPath] = useState<Route>(() => {
    const path = window.location.pathname.substring(1);
    if (['home', 'questionnaire', 'search', 'results', 'profile'].includes(path)) {
      return path as Route;
    }
    return initialRoute;
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.substring(1);
      if (['home', 'questionnaire', 'search', 'results', 'profile'].includes(path)) {
        setCurrentPath(path as Route);
      } else {
        setCurrentPath(initialRoute);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialRoute]);

  const navigate = (path: Route) => {
    if (path === 'home') {
      window.history.pushState({}, '', '/');
    } else {
      window.history.pushState({}, '', `/${path}`);
    }
    setCurrentPath(path);
  };

  return { currentPath, navigate };
}
