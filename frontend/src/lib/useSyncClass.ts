// React hook for syncing class content
"use client";

import { useEffect, useState } from 'react';
import { fetchClassContent } from './classUtils';

export interface ClassContent {
  code: string;
  name: string;
  subject?: string;
  description?: string;
  session: {
    id: string;
    title: string;
    date: string;
    materials: {
      pdfs: number;
      audio: number;
      video: number;
      images: number;
    };
    files: Array<{ name: string; type: string }>;
    activeModes: string[];
    notes: string | null;
    flashcards: any;
    quiz: any;
    podcast: any;
    visual: any;
    quest: any;
    progress: {
      notes: number;
      flashcards: number;
      quiz: number;
      podcast: number;
      visual: number;
      quest: number;
      audio: number;
    };
    createdAt: string;
    updatedAt: string;
  };
}

interface UseSyncClassOptions {
  enabled?: boolean;
  refetchInterval?: number; // ms
}

export function useSyncClass(classCode: string | null, options: UseSyncClassOptions = {}) {
  const { enabled = true, refetchInterval = 0 } = options;
  const [classContent, setClassContent] = useState<ClassContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || !classCode) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const content = await fetchClassContent(classCode);
        setClassContent(content);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch class');
      } finally {
        setLoading(false);
      }
    }

    load();

    // Set up polling if interval is specified
    if (refetchInterval > 0) {
      const interval = setInterval(load, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [classCode, enabled, refetchInterval]);

  const refetch = async () => {
    if (!classCode) return;
    try {
      setError(null);
      const content = await fetchClassContent(classCode);
      setClassContent(content);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refetch');
    }
  };

  return {
    classContent,
    loading,
    error,
    lastUpdated,
    refetch,
    isUpdated: lastUpdated ? Date.now() - lastUpdated.getTime() < 60000 : false,
  };
}
