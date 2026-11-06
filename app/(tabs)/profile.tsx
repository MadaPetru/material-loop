import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Screen } from '@/components/ui/Screen';
import { formatCityCounty } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { formatRoPhoneDisplay } from '@/lib/phone';
import { toUserError } from '@/lib/userErrors';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount, isDemo, can, refresh } = useAuth();
  const { t } = useLocale();
  const { isDesktop } = useResponsive();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => {
        /* keep session */
      });
    }, [refresh]),
  );

  if (!user) {
    return (
      <View style={styles.center}>
        <EmptyState
          title={t('profile.gateTitle')}
          subtitle={t('profile.gateSub')}
          actionLabel={t('nav.login')}
          onAction={() => router.push('/(auth)/login')}
        />
        <Button
          label={t('profile.createAccount')}
          variant="secondary"
          onPress={() => router.push('/(auth)/register')}
          style={{ marginHorizontal: spacing.xl }}
        />
      </View>
    );
  }

  const runDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      setConfirmOpen(false);
      router.replace('/');
    } catch (e) {
      setConfirmOpen(false);
      setError(toUserError(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.card}>
        <View style={styles.headerTop}>
          <Text style={styles.name}>{user.displayName}</Text>
          {!isDesktop ? <LanguageSelector /> : null}
        </View>
        <Text style={styles.meta}>
          {user.cityId ? formatCityCounty(user.cityId) : t('profile.locationUnset')} ·{' '}
          {user.accountType === 'business' ? t('profile.business') : t('profile.individual')}
          {can('admin.panel') ? ` · ${t('admin.roleAdmin')}` : ''}
        </Text>
        <Text style={styles.meta}>
          {t('admin.usersSection')}: {user.roles.join(', ')}
        </Text>
        {can('admin.panel') ? (
          <Button
            label={t('nav.admin')}
            onPress={() => router.push('/admin')}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}
        {user.sellerRating != null ? (
          <Text style={styles.meta}>
            {t('profile.ratingLine', {
              rating: user.sellerRating.toFixed(1),
              count: user.ratingCount,
              sales: user.completedSales,
            })}
          </Text>
        ) : (
          <Text style={styles.meta}>{t('profile.noRating')}</Text>
        )}
        {user.phone && user.phoneVerifiedAt ? (
          <Text style={styles.meta}>
            {formatRoPhoneDisplay(user.phone)} · {t('profile.phoneVerified')}
          </Text>
        ) : (
          <Text style={styles.meta}>
            {t('profile.phone')}: {t('profile.phoneUnverified')}
          </Text>
        )}
        {isDemo ? <Text style={styles.demo}>{t('profile.demoNote')}</Text> : null}
        {error ? <ErrorBanner message={error} /> : null}
        <View style={[styles.actions, isDesktop && styles.actionsRow]}>
          <Button
            label={t('profile.myListings')}
            onPress={() => router.push('/my-listings')}
            style={isDesktop ? styles.actionFlex : undefined}
          />
          <Button
            label={t('profile.editProfile')}
            variant="secondary"
            onPress={() => router.push('/profile/edit')}
            style={isDesktop ? styles.actionFlex : undefined}
          />
          <Button
            label={t('profile.publishListing')}
            variant="secondary"
            onPress={() => router.push('/listing/create')}
            style={isDesktop ? styles.actionFlex : undefined}
          />
          <Button
            label={t('nav.contact')}
            variant="ghost"
            onPress={() => router.push('/contact')}
            style={isDesktop ? styles.actionFlex : undefined}
          />
          <Button
            label={t('profile.signOut')}
            variant="ghost"
            onPress={() => signOut()}
            style={isDesktop ? styles.actionFlex : undefined}
          />
        </View>
        <Pressable onPress={() => router.push('/legal/terms')}>
          <Text style={styles.legal}>{t('profile.legal')}</Text>
        </Pressable>
        <View style={styles.dangerZone}>
          <Button
            label={t('profile.deleteAccount')}
            variant="danger"
            onPress={() => {
              setError(null);
              setConfirmOpen(true);
            }}
            disabled={deleting}
          />
        </View>
      </View>

      <ConfirmDialog
        visible={confirmOpen}
        title={t('profile.deleteAccountConfirmTitle')}
        message={t('profile.deleteAccountConfirmBody')}
        confirmLabel={deleting ? t('profile.deletingAccount') : t('profile.deleteAccountConfirmAction')}
        cancelLabel={t('common.cancel')}
        destructive
        busy={deleting}
        onCancel={() => {
          if (!deleting) setConfirmOpen(false);
        }}
        onConfirm={runDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', gap: spacing.md },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  name: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, flex: 1 },
  meta: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 14 },
  demo: {
    fontFamily: fonts.sans,
    color: colors.accent,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  actionFlex: { flexGrow: 1, minWidth: 160 },
  legal: {
    fontFamily: fonts.sansMedium,
    color: colors.brand,
    marginTop: spacing.sm,
    fontSize: 13,
  },
  dangerZone: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
