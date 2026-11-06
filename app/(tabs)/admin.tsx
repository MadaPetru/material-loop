import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { marketplace } from '@/lib/api/marketplace';
import { buildAdminUserMailto } from '@/lib/contact';
import { hasRole, resolveEntitlements } from '@/lib/entitlements';
import { toUserError } from '@/lib/userErrors';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import type { AdminAnalytics, Profile } from '@/lib/types';

type PendingAction =
  | { type: 'admin'; user: Profile; setAdmin: boolean }
  | { type: 'deactivate'; user: Profile; deactivated: boolean }
  | null;

export default function AdminScreen() {
  const { user, can } = useAuth();
  const { t, locale } = useLocale();
  const { contentPad, isDesktop } = useResponsive();
  const [users, setUsers] = useState<Profile[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const allowed = can('admin.panel');
  const canReadUsers = can('admin.users.read');
  const canManageUsers = can('admin.users.manage');
  const canEmailUsers = can('admin.users.email');
  const canSeeAnalytics = can('admin.analytics');

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = canReadUsers ? await marketplace.adminListUsers() : [];
      const stats = canSeeAnalytics ? await marketplace.adminGetAnalytics() : null;
      setUsers(list);
      setAnalytics(stats);
    } catch (e) {
      setError(toUserError(e));
    } finally {
      setLoading(false);
    }
  }, [allowed, canReadUsers, canSeeAnalytics]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roles.some((r) => r.includes(q)),
    );
  }, [users, query]);

  if (!user) {
    return (
      <View style={styles.center}>
        <EmptyState
          title={t('admin.gateTitle')}
          subtitle={t('admin.gateSub')}
          actionLabel={t('nav.login')}
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.center}>
        <EmptyState
          title={t('admin.forbiddenTitle')}
          subtitle={t('admin.forbiddenSub')}
          actionLabel={t('nav.home')}
          onAction={() => router.replace('/')}
        />
      </View>
    );
  }

  const emailUser = async (target: Profile) => {
    try {
      const url = buildAdminUserMailto({
        toEmail: target.email,
        subject: t('admin.emailSubjectDefault'),
        message: t('admin.emailBodyDefault', { name: target.displayName }),
        adminName: user.displayName,
      });
      await Linking.openURL(url);
    } catch (e) {
      setError(toUserError(e));
    }
  };

  const applyPending = async () => {
    if (!pending) return;
    setBusyId(pending.user.id);
    setError(null);
    try {
      const updated =
        pending.type === 'admin'
          ? await marketplace.adminUpdateUser(pending.user.id, { setAdmin: pending.setAdmin })
          : await marketplace.adminUpdateUser(pending.user.id, {
              deactivated: pending.deactivated,
            });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setAnalytics(await marketplace.adminGetAnalytics());
      setPending(null);
    } catch (e) {
      setError(toUserError(e));
      setPending(null);
    } finally {
      setBusyId(null);
    }
  };

  const confirmCopy = (() => {
    if (!pending) return { title: '', message: '', confirm: '' };
    if (pending.type === 'admin') {
      return {
        title: pending.setAdmin ? t('admin.promoteTitle') : t('admin.demoteTitle'),
        message: pending.setAdmin
          ? t('admin.promoteBody', { name: pending.user.displayName })
          : t('admin.demoteBody', { name: pending.user.displayName }),
        confirm: pending.setAdmin ? t('admin.makeAdmin') : t('admin.makeUser'),
      };
    }
    return {
      title: pending.deactivated ? t('admin.deactivateTitle') : t('admin.reactivateTitle'),
      message: pending.deactivated
        ? t('admin.deactivateBody', { name: pending.user.displayName })
        : t('admin.reactivateBody', { name: pending.user.displayName }),
      confirm: pending.deactivated ? t('admin.deactivate') : t('admin.reactivate'),
    };
  })();

  return (
    <View style={styles.root}>
      <FlatList
        data={filtered}
        key={locale}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingHorizontal: contentPad },
          isDesktop && { maxWidth: layout.contentMax, alignSelf: 'center', width: '100%' },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{t('admin.eyebrow')}</Text>
            <Text style={styles.title}>{t('admin.title')}</Text>
            <Text style={styles.sub}>{t('admin.sub')}</Text>
            {error ? <ErrorBanner message={error} /> : null}

            {canSeeAnalytics && analytics ? (
              <View style={styles.stats}>
                <Stat label={t('admin.statUsers')} value={String(analytics.usersTotal)} />
                <Stat label={t('admin.statActive')} value={String(analytics.usersActive)} />
                <Stat label={t('admin.statAdmins')} value={String(analytics.admins)} />
                <Stat label={t('admin.statListings')} value={String(analytics.listingsActive)} />
                <Stat label={t('admin.statConversations')} value={String(analytics.conversations)} />
                <Stat
                  label={t('admin.statDeactivated')}
                  value={String(analytics.usersDeactivated)}
                />
              </View>
            ) : null}

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('admin.searchPlaceholder')}
              placeholderTextColor={colors.inkFaint}
              style={styles.search}
            />
            <Text style={styles.section}>{t('admin.usersSection')}</Text>
            {loading ? <ActivityIndicator color={colors.brand} style={{ marginVertical: 12 }} /> : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>{t('admin.noUsers')}</Text>
          ) : (
            <View />
          )
        }
        renderItem={({ item }) => {
          const self = item.id === user.id;
          const busy = busyId === item.id;
          const itemEntitlements = resolveEntitlements(item.roles);
          return (
            <View style={[styles.card, item.deactivatedAt ? styles.cardMuted : null]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.name}>
                    {item.displayName}
                    {self ? ` (${t('admin.you')})` : ''}
                  </Text>
                  <Text style={styles.meta}>{item.email}</Text>
                  <Text style={styles.meta}>
                    {item.roles.join(', ')}
                    {item.deactivatedAt
                      ? ` · ${t('admin.statusDeactivated')}`
                      : ` · ${t('admin.statusActive')}`}
                  </Text>
                  <Text style={styles.entitlements} numberOfLines={2}>
                    {itemEntitlements.join(' · ')}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                {canEmailUsers ? (
                  <Button
                    label={t('admin.emailUser')}
                    variant="secondary"
                    compact
                    onPress={() => emailUser(item)}
                    disabled={busy || !item.email}
                    style={styles.action}
                  />
                ) : null}
                {canManageUsers && !self ? (
                  <Button
                    label={hasRole(item.roles, 'admin') ? t('admin.makeUser') : t('admin.makeAdmin')}
                    variant="ghost"
                    compact
                    onPress={() =>
                      setPending({
                        type: 'admin',
                        user: item,
                        setAdmin: !hasRole(item.roles, 'admin'),
                      })
                    }
                    disabled={busy}
                    style={styles.action}
                  />
                ) : null}
                {canManageUsers && !self ? (
                  <Button
                    label={item.deactivatedAt ? t('admin.reactivate') : t('admin.deactivate')}
                    variant={item.deactivatedAt ? 'secondary' : 'danger'}
                    compact
                    onPress={() =>
                      setPending({
                        type: 'deactivate',
                        user: item,
                        deactivated: !item.deactivatedAt,
                      })
                    }
                    disabled={busy}
                    style={styles.action}
                  />
                ) : null}
              </View>
            </View>
          );
        }}
      />

      <ConfirmDialog
        visible={Boolean(pending)}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={busyId ? t('common.loading') : confirmCopy.confirm}
        cancelLabel={t('common.cancel')}
        destructive={pending?.type === 'deactivate' && pending.deactivated}
        busy={Boolean(busyId)}
        onCancel={() => {
          if (!busyId) setPending(null);
        }}
        onConfirm={applyPending}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  list: { paddingVertical: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.inkMuted },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stat: {
    minWidth: 140,
    flexGrow: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 2,
  },
  statValue: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.brand },
  statLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted },
  search: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 16,
  },
  section: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginTop: spacing.md,
  },
  empty: { fontFamily: fonts.sans, color: colors.inkMuted, paddingVertical: spacing.lg },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardMuted: { opacity: 0.72 },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  name: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  entitlements: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.inkFaint,
    marginTop: 2,
  },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { flexGrow: 1, minWidth: 120 },
});
