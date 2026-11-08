import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { marketplace } from '@/lib/api/marketplace';
import { IS_DEMO } from '@/lib/config';
import { getSupabase } from '@/lib/supabase';

const POLL_MS = 10_000;

type UnreadMessagesContextValue = {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  setActiveConversationId: (conversationId: string | null) => void;
  clearLocalUnread: () => void;
};

const UnreadMessagesContext = createContext<UnreadMessagesContextValue | null>(null);

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const { user, can } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = user?.id;
  const canRead = !!userId && can('messages.read');
  const refreshSeq = useRef(0);
  const activeConversationIdRef = useRef<string | null>(null);

  const refreshUnread = useCallback(async () => {
    if (!userId || !canRead) {
      setUnreadCount(0);
      return;
    }
    const seq = ++refreshSeq.current;
    const activeId = activeConversationIdRef.current;
    try {
      const rows = await marketplace.listConversations(userId);
      if (seq !== refreshSeq.current) return;
      // Conversations the user is currently viewing should not light the tab badge.
      const count = rows.filter((c) => c.unread && c.id !== activeId).length;
      setUnreadCount(count);
    } catch {
      /* keep last known count */
    }
  }, [userId, canRead]);

  const setActiveConversationId = useCallback(
    (conversationId: string | null) => {
      if (activeConversationIdRef.current === conversationId) return;
      activeConversationIdRef.current = conversationId;
      refreshUnread().catch(() => {
        /* keep last known count */
      });
    },
    [refreshUnread]
  );

  const clearLocalUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!canRead) {
      setUnreadCount(0);
      return;
    }

    refreshUnread();
    const interval = setInterval(() => {
      refreshUnread();
    }, POLL_MS);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') refreshUnread();
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [canRead, refreshUnread]);

  // Keep the tab badge fresh even when the user is on another screen.
  useEffect(() => {
    if (!canRead || !userId || IS_DEMO) return;
    const sb = getSupabase();
    if (!sb) return;

    const channel = sb
      .channel(`unread-badge-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          refreshUnread();
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [canRead, userId, refreshUnread]);

  const value = useMemo(
    () => ({ unreadCount, refreshUnread, setActiveConversationId, clearLocalUnread }),
    [unreadCount, refreshUnread, setActiveConversationId, clearLocalUnread]
  );

  return (
    <UnreadMessagesContext.Provider value={value}>{children}</UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  const ctx = useContext(UnreadMessagesContext);
  if (!ctx) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return ctx;
}
