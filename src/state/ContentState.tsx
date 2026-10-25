import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { BUNDLED, type Content, loadCachedContent, refreshContent } from '../lib/content';

type Ctx = { content: Content; refresh: () => Promise<void>; refreshing: boolean };

const ContentContext = createContext<Ctx | null>(null);
const STALE_MS = 6 * 60 * 60 * 1000;

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Content>(BUNDLED);
  const [refreshing, setRefreshing] = useState(false);
  const fetchedAt = useRef<number>(0);
  const current = useRef<Content>(BUNDLED);
  current.current = content;
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    const fresh = await refreshContent(current.current);
    if (fresh) {
      fetchedAt.current = fresh.fetchedAt ?? Date.now();
      // Same server version as what's on screen: only the timestamp changed, so skip the re-render.
      const unchanged = fresh.contentVersion != null && fresh.contentVersion === current.current.contentVersion && current.current !== BUNDLED;
      if (!unchanged) setContent(fresh);
    }
    setRefreshing(false);
    inFlight.current = false;
  }, []);

  useEffect(() => {
    let alive = true;
    const refreshIfStale = () => {
      if (Date.now() - fetchedAt.current > STALE_MS) refresh();
    };
    loadCachedContent().then((c) => {
      if (!alive) return;
      fetchedAt.current = c.fetchedAt ?? 0;
      setContent(c);
      refreshIfStale();
    });
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') refreshIfStale();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, [refresh]);

  const value = useMemo(() => ({ content, refresh, refreshing }), [content, refresh, refreshing]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): Ctx {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside ContentProvider');
  return ctx;
}
