'use client';

import { useCallback, useEffect, useState } from 'react';

// LocalStorage key used for storing compared moto ids
const STORAGE_KEY = 'compare:motos';

export default function useCompare() {
  const [compareMotos, setCompareMotos] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
      setCompareMotos(stored);
    } catch {
      // ignore parse errors
      setCompareMotos([]);
    }
  }, []);

  const addMoto = useCallback((id: string) => {
    setCompareMotos((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeMoto = useCallback((id: string) => {
    setCompareMotos((prev) => {
      const updated = prev.filter((m) => m !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCompareMotos([]);
  }, []);

  return { compareMotos, addMoto, removeMoto, clear };
}

