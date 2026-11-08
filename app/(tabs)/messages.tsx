import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext';
import { marketplace } from '@/lib/api/marketplace';
import { IS_DEMO } from '@/lib/config';
import { resolveListingCoverUrl } from '@/lib/defaultListingPhoto';
import { getSupabase } from '@/lib/supabase';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import { toUserError } from '@/lib/userErrors';
import type { ChatMessage, ConversationWithMeta } from '@/lib/types';

const THREAD_POLL_MS = 2500;

function threadIsBehind(open: ConversationWithMeta | undefined, local: ChatMessage[]) {
  if (!open?.lastMessageAt) return false;
  const last = local[local.length - 1];
  if (!last) return !!open.lastMessageBody;
  if (open.lastMessageAt > last.createdAt) return true;
  if (open.lastMessageSenderId && open.lastMessageSenderId !== last.senderId) return true;
  if (open.lastMessageBody != null && open.lastMessageBody !== last.body) return true;
  return false;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { refreshUnread, setActiveConversationId } = useUnreadMessages();
  const { isDesktop, contentPad } = useResponsive();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selected, setSelected] = useState<ConversationWithMeta | null>(null);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convQuery, setConvQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const syncingRef = useRef(false);
  const focusedRef = useRef(false);

  // Tab screens stay mounted; track focus so we don't mark chats read in the background.
  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      setIsFocused(true);
      setActiveConversationId(selectedIdRef.current);
      return () => {
        focusedRef.current = false;
        setIsFocused(false);
        setActiveConversationId(null);
      };
    }, [setActiveConversationId])
  );

  useEffect(() => {
    if (!isFocused) return;
    setActiveConversationId(selectedId);
  }, [isFocused, selectedId, setActiveConversationId]);

  const filteredConversations = useMemo(() => {
    const q = convQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = c.otherUser?.displayName?.toLowerCase() ?? '';
      const title = c.listingTitle?.toLowerCase() ?? '';
      const preview = c.lastMessageBody?.toLowerCase() ?? '';
      return name.includes(q) || title.includes(q) || preview.includes(q);
    });
  }, [conversations, convQuery]);

  const applyMessages = useCallback((msgs: ChatMessage[], opts?: { scroll?: boolean; animated?: boolean }) => {
    messagesRef.current = msgs;
    setMessages(msgs);
    if (opts?.scroll) {
      setTimeout(
        () => listRef.current?.scrollToEnd({ animated: opts.animated ?? false }),
        50
      );
    }
  }, []);

  const loadConversations = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!user) return;
      const silent = !!opts?.silent;
      if (!silent) setLoadingList(true);
      try {
        const rows = await marketplace.listConversations(user.id);
        const openId = selectedIdRef.current;
        setConversations(
          openId ? rows.map((c) => (c.id === openId ? { ...c, unread: false } : c)) : rows
        );
        await refreshUnread();
      } catch (e) {
        if (!silent) setError(toUserError(e));
      } finally {
        if (!silent) setLoadingList(false);
      }
    },
    [user, refreshUnread]
  );

  const openConversation = useCallback(
    async (id: string) => {
      if (!user) return;
      selectedIdRef.current = id;
      setSelectedId(id);
      if (focusedRef.current) setActiveConversationId(id);
      setLoadingThread(true);
      setError(null);
      try {
        const [meta, msgs] = await Promise.all([
          marketplace.getConversation(id, user.id),
          marketplace.getMessages(id, user.id),
        ]);
        setSelected(meta);
        applyMessages(msgs, { scroll: true, animated: false });
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unread: false } : c))
        );
        // Only mark read while the user is actually looking at Messages.
        if (focusedRef.current) {
          await marketplace.markConversationRead(id, user.id);
          await refreshUnread();
        }
      } catch (e) {
        setError(toUserError(e));
      } finally {
        setLoadingThread(false);
      }
    },
    [user, refreshUnread, applyMessages, setActiveConversationId]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const fromParam = typeof params.conversationId === 'string' ? params.conversationId : null;
    if (!fromParam) return;
    openConversation(fromParam);
    // Only react to the deep-link param, not conversation list refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.conversationId]);

  useEffect(() => {
    if (params.conversationId) return;
    if (isDesktop && conversations[0] && !selectedId) {
      openConversation(conversations[0].id);
    }
  }, [params.conversationId, conversations, isDesktop, selectedId, openConversation]);

  const refreshOpenThread = useCallback(async () => {
    if (!user || syncingRef.current || !focusedRef.current) return;
    const openId = selectedIdRef.current;
    if (!openId) {
      await loadConversations({ silent: true });
      return;
    }

    syncingRef.current = true;
    try {
      // List first so we can detect a newer preview, then reload the thread if needed.
      const rows = await marketplace.listConversations(user.id);
      if (!focusedRef.current || selectedIdRef.current !== openId) return;

      const open = rows.find((c) => c.id === openId);
      setConversations(rows.map((c) => (c.id === openId ? { ...c, unread: false } : c)));
      if (open) setSelected(open);

      const prev = messagesRef.current;
      const needsThread = threadIsBehind(open, prev);
      if (!needsThread) {
        await refreshUnread();
        return;
      }

      const msgs = await marketplace.getMessages(openId, user.id);
      if (!focusedRef.current || selectedIdRef.current !== openId) return;

      const prevIds = new Set(prev.map((m) => m.id));
      const newFromOther = msgs.filter((m) => m.senderId !== user.id && !prevIds.has(m.id));
      applyMessages(msgs, { scroll: true, animated: true });

      if (newFromOther.length > 0) {
        await marketplace.markConversationRead(openId, user.id);
      }
      await refreshUnread();
    } catch {
      /* keep current thread */
    } finally {
      syncingRef.current = false;
    }
  }, [user, loadConversations, applyMessages, refreshUnread]);

  // Poll only while Messages is focused — tab screens stay mounted in the background.
  useEffect(() => {
    if (!user || !isFocused) return;
    let cancelled = false;

    const tick = () => {
      if (!cancelled) refreshOpenThread();
    };

    tick();
    const interval = setInterval(tick, THREAD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, selectedId, isFocused, refreshOpenThread]);

  // Instant updates for the open conversation (Supabase Realtime).
  useEffect(() => {
    if (!user || !selectedId || !isFocused || IS_DEMO) return;
    const sb = getSupabase();
    if (!sb) return;

    const channel = sb
      .channel(`messages-thread-${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedId}`,
        },
        () => {
          refreshOpenThread();
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [user, selectedId, isFocused, refreshOpenThread]);

  const send = async () => {
    if (!user || !selectedId || !draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const msg = await marketplace.sendMessage(selectedId, user.id, draft);
      applyMessages([...messagesRef.current, msg], { scroll: true, animated: true });
      setDraft('');
      await loadConversations({ silent: true });
    } catch (e) {
      setError(toUserError(e));
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <EmptyState
          title={t('messages.gateTitle')}
          subtitle={t('messages.gateSub')}
          actionLabel={t('nav.login')}
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  const showList = isDesktop || !selectedId;
  const showThread = isDesktop || !!selectedId;

  return (
    <View
      style={[
        styles.root,
        isDesktop && styles.rootDesktop,
        { paddingHorizontal: isDesktop ? contentPad : 0 },
      ]}
    >
      {showList ? (
        <View style={[styles.sidebar, isDesktop && styles.sidebarDesktop]}>
          <Text style={styles.heading}>{t('messages.title')}</Text>
          <TextInput
            value={convQuery}
            onChangeText={setConvQuery}
            placeholder={t('messages.searchPlaceholder')}
            placeholderTextColor={colors.inkFaint}
            style={styles.search}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <ErrorBanner message={error && !selectedId ? error : null} />
          {loadingList ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={filteredConversations}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
              ListEmptyComponent={
                <EmptyState
                  title={convQuery.trim() ? t('messages.noSearchResults') : t('messages.emptyTitle')}
                  subtitle={
                    convQuery.trim() ? t('messages.noSearchResultsSub') : t('messages.emptySub')
                  }
                  actionLabel={convQuery.trim() ? undefined : t('favorites.findMaterials')}
                  onAction={convQuery.trim() ? undefined : () => router.push('/search')}
                />
              }
              renderItem={({ item }) => {
                const active = item.id === selectedId;
                const unread = !!item.unread;
                return (
                  <Pressable
                    onPress={() => openConversation(item.id)}
                    style={[
                      styles.convRow,
                      active && styles.convRowActive,
                      unread && !active && styles.convRowUnread,
                    ]}
                  >
                    <View style={styles.avatar}>
                      {item.listingCategoryId || item.listingPhotoUrl ? (
                        <Image
                          source={{
                            uri: resolveListingCoverUrl(
                              item.listingPhotoUrl ? [{ url: item.listingPhotoUrl }] : [],
                              item.listingCategoryId ?? 'cat-other',
                              item.listingSubcategoryId,
                              locale
                            ),
                          }}
                          style={styles.avatarImg}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={styles.avatarLetter}>
                          {(item.otherUser?.displayName ?? '?').slice(0, 1).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.convBody}>
                      <View style={styles.convTitleRow}>
                        <Text
                          style={[styles.convName, unread && styles.convNameUnread]}
                          numberOfLines={1}
                        >
                          {item.otherUser?.displayName ?? t('messages.userFallback')}
                        </Text>
                        {unread ? <View style={styles.unreadDot} /> : null}
                      </View>
                      <Text style={styles.convListing} numberOfLines={1}>
                        {item.listingTitle ?? t('messages.listingFallback')}
                      </Text>
                      <Text
                        style={[styles.convPreview, unread && styles.convPreviewUnread]}
                        numberOfLines={1}
                      >
                        {item.lastMessageBody ?? t('messages.noMessagesYet')}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      ) : null}

      {showThread ? (
        <KeyboardAvoidingView
          style={[styles.thread, isDesktop && styles.threadDesktop]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          {!selectedId ? (
            <View style={styles.threadEmpty}>
              <Text style={styles.threadEmptyText}>{t('messages.selectConversation')}</Text>
            </View>
          ) : (
            <>
              <View style={styles.threadHeader}>
                {!isDesktop ? (
                  <Pressable
                    onPress={() => {
                      selectedIdRef.current = null;
                      setSelectedId(null);
                      if (focusedRef.current) setActiveConversationId(null);
                    }}
                    style={styles.backBtn}
                  >
                    <Text style={styles.backText}>{t('common.back')}</Text>
                  </Pressable>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.threadTitle} numberOfLines={1}>
                    {selected?.otherUser?.displayName ?? t('messages.userFallback')}
                  </Text>
                  <Text style={styles.threadSub} numberOfLines={1}>
                    {selected?.listingTitle ?? ''}
                  </Text>
                </View>
                {selected?.listingId ? (
                  <Pressable onPress={() => router.push(`/listing/${selected.listingId}`)}>
                    <Text style={styles.listingLink}>{t('messages.viewListing')}</Text>
                  </Pressable>
                ) : null}
              </View>

              <ErrorBanner message={error && selectedId ? error : null} />

              {loadingThread ? (
                <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
              ) : (
                <FlatList
                  ref={listRef}
                  data={messages}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.msgList}
                  onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                  ListEmptyComponent={
                    <Text style={styles.emptyThread}>{t('messages.firstMessageHint')}</Text>
                  }
                  renderItem={({ item }) => {
                    const mine = item.senderId === user.id;
                    return (
                      <View style={[styles.bubbleWrap, mine && styles.bubbleWrapMine]}>
                        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                            {item.body}
                          </Text>
                        </View>
                        <Text style={styles.msgTime}>
                          {new Date(item.createdAt).toLocaleString(locale === 'en' ? 'en-GB' : 'ro-RO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    );
                  }}
                />
              )}

              <View style={styles.composer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('messages.placeholder')}
                  placeholderTextColor={colors.inkFaint}
                  value={draft}
                  onChangeText={setDraft}
                  multiline
                  maxLength={2000}
                />
                <Button
                  label={sending ? '…' : t('common.send')}
                  compact
                  onPress={send}
                  disabled={sending || !draft.trim()}
                />
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  rootDesktop: {
    flexDirection: 'row',
    maxWidth: layout.contentMax,
    alignSelf: 'center',
    width: '100%',
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  sidebar: { flex: 1, backgroundColor: colors.bgElevated },
  sidebarDesktop: {
    flex: 0.38,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  search: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.sans,
    color: colors.ink,
  },
  convRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  convRowActive: { backgroundColor: colors.brandSoft },
  convRowUnread: { backgroundColor: colors.accentSoft },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.mapDust,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { fontFamily: fonts.sansBold, color: colors.ink, fontSize: 18 },
  convBody: { flex: 1, gap: 2 },
  convTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  convName: { flex: 1, fontFamily: fonts.sansBold, color: colors.ink, fontSize: 15 },
  convNameUnread: { color: colors.ink },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  convListing: { fontFamily: fonts.sansMedium, color: colors.brand, fontSize: 13 },
  convPreview: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13 },
  convPreviewUnread: { fontFamily: fonts.sansMedium, color: colors.ink },
  thread: { flex: 1, backgroundColor: colors.bg },
  threadDesktop: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  threadEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  threadEmptyText: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 15 },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.bgElevated,
  },
  backBtn: { paddingVertical: spacing.xs },
  backText: { fontFamily: fonts.sansMedium, color: colors.brand },
  threadTitle: { fontFamily: fonts.sansBold, color: colors.ink, fontSize: 16 },
  threadSub: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13 },
  listingLink: { fontFamily: fonts.sansMedium, color: colors.brand, fontSize: 13 },
  msgList: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  emptyThread: {
    fontFamily: fonts.sans,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
    lineHeight: 22,
  },
  bubbleWrap: { alignItems: 'flex-start', gap: 4, maxWidth: '85%' },
  bubbleWrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bubbleMine: { backgroundColor: colors.brand },
  bubbleTheirs: { backgroundColor: colors.bgMuted, borderWidth: 1, borderColor: colors.line },
  bubbleText: { fontFamily: fonts.sans, color: colors.ink, fontSize: 15, lineHeight: 21 },
  bubbleTextMine: { color: colors.white },
  msgTime: { fontFamily: fonts.sans, color: colors.inkFaint, fontSize: 11 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bgElevated,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
});
