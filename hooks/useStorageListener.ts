import { useEffect, useCallback } from 'react';

/**
 * Custom hook to listen for changes in localStorage across browser tabs.
 * @param callback A memoized callback function that will be executed when a storage event occurs.
 */
export const useStorageListener = (callback: (event: StorageEvent) => void) => {
  useEffect(() => {
    window.addEventListener('storage', callback);
    return () => {
      window.removeEventListener('storage', callback);
    };
  }, [callback]);
};
