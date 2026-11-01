import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import { toUserError } from '@/lib/userErrors';
import type { ChatMessage, ConversationWithMeta } from '@/lib/types';

export default function MessagesScreen() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
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
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    try {
      const rows = await marketplace.listConversations(user.id);
      setConversations(rows);
    } catch (e) {
      setError(toUserError(e));
    } finally {
      setLoadingList(false);
    }
  }, [user]);

  const openConversation = useCallback(
    async (id: string) => {
      if (!user) return;
      setSelectedId(id);
      setLoadingThread(true);
      setError(null);
      try {
        const [meta, msgs] = await Promise.all([
          marketplace.getConversation(id, user.id),
          marketplace.getMessages(id, user.id),
        ]);
        setSelected(meta);
        setMessages(msgs);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
      } catch (e) {
        setError(toUserError(e));
      } finally {
        setLoadingThread(false);
      }
    },
    [user]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const fromParam = typeof params.conversationId === 'string' ? params.conversationId : null;
    if (fromParam) {
      openConversation(fromParam);
      return;
    }
    if (isDesktop && conversations[0] && !selectedId) {
      openConversation(conversations[0].id);
    }
  }, [params.conversationId, conversations, isDesktop, selectedId, openConversation]);

  const send = async () => {
    if (!user || !selectedId || !draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const msg = await marketplace.sendMessage(selectedId, user.id, draft);
      setMessages((prev) => [...prev, msg]);
      setDraft('');
      await loadConversations();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
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
          <ErrorBanner message={error && !selectedId ? error : null} />
          {loadingList ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
              ListEmptyComponent={
                <EmptyState
                  title={t('messages.emptyTitle')}
                  subtitle={t('messages.emptySub')}
                  actionLabel={t('favorites.findMaterials')}
                  onAction={() => router.push('/search')}
                />
              }
              renderItem={({ item }) => {
                const active = item.id === selectedId;
                return (
                  <Pressable
                    onPress={() => openConversation(item.id)}
                    style={[styles.convRow, active && styles.convRowActive]}
                  >
                    <View style={styles.avatar}>
                      {item.listingPhotoUrl ? (
                        <Image
                          source={{ uri: item.listingPhotoUrl }}
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
                      <Text style={styles.convName} numberOfLines={1}>
                        {item.otherUser?.displayName ?? t('messages.userFallback')}
                      </Text>
                      <Text style={styles.convListing} numberOfLines={1}>
                        {item.listingTitle ?? t('messages.listingFallback')}
                      </Text>
                      <Text style={styles.convPreview} numberOfLines={1}>
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
                  <Pressable onPress={() => setSelectedId(null)} style={styles.backBtn}>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  convRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  convRowActive: { backgroundColor: colors.brandSoft },
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
  convName: { fontFamily: fonts.sansBold, color: colors.ink, fontSize: 15 },
  convListing: { fontFamily: fonts.sansMedium, color: colors.brand, fontSize: 13 },
  convPreview: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13 },
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
