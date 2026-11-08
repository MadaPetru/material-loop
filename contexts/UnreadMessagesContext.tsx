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

const POLL_MS = 20_000;

type UnreadMessagesContextValue = {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  clearLocalUnread: () => void;
};

const UnreadMessagesContext = createContext<UnreadMessagesContextValue | null>(null);

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const { user, can } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = user?.id;
  const canRead = !!userId && can('messages.read');
  const refreshSeq = useRef(0);

  const refreshUnread = useCallback(async () => {
    if (!userId || !canRead) {
      setUnreadCount(0);
      return;
    }
    const seq = ++refreshSeq.current;
    try {
      const count = await marketplace.countUnreadConversations(userId);
      if (seq === refreshSeq.current) setUnreadCount(count);
    } catch {
      /* keep last known count */
    }
  }, [userId, canRead]);

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

  const value = useMemo(
    () => ({ unreadCount, refreshUnread, clearLocalUnread }),
    [unreadCount, refreshUnread, clearLocalUnread]
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
