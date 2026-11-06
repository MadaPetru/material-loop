import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Screen } from '@/components/ui/Screen';
import { formatCityCounty } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';

export default function ProfileScreen() {
  const { user, signOut, isDemo } = useAuth();
  const { t } = useLocale();
  const { isDesktop } = useResponsive();

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
        </Text>
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
        {isDemo ? <Text style={styles.demo}>{t('profile.demoNote')}</Text> : null}
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
            label={t('profile.signOut')}
            variant="ghost"
            onPress={() => signOut()}
            style={isDesktop ? styles.actionFlex : undefined}
          />
        </View>
        <Pressable onPress={() => router.push('/legal/terms')}>
          <Text style={styles.legal}>{t('profile.legal')}</Text>
        </Pressable>
      </View>
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
});
