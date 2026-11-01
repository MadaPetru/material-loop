import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { formatCityCounty } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import type { ListingWithRelations } from '@/lib/types';

export default function ProfileScreen() {
  const { user, signOut, isDemo } = useAuth();
  const { t, locale } = useLocale();
  const { columns, contentPad, isDesktop } = useResponsive();
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    marketplace
      .listingsForSeller(user.id)
      .then((res) => {
        if (active) setListings(res);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

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
    <FlatList
      style={styles.root}
      data={listings}
      key={`${columns}-${locale}`}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.list,
        { paddingHorizontal: contentPad },
        isDesktop && { maxWidth: layout.contentMax, alignSelf: 'center', width: '100%' },
      ]}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      ListHeaderComponent={
        <View style={styles.header}>
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
              label={t('profile.editProfile')}
              variant="secondary"
              onPress={() => router.push('/profile/edit')}
              style={isDesktop ? styles.actionFlex : undefined}
            />
            <Button
              label={t('profile.publishListing')}
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
          <Text style={styles.section}>{t('profile.myListings')}</Text>
          {loading ? <ActivityIndicator color={colors.brand} /> : null}
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <EmptyState
            title={t('profile.emptyListingsTitle')}
            subtitle={t('profile.emptyListingsSub')}
            actionLabel={t('profile.createListing')}
            onAction={() => router.push('/listing/create')}
          />
        ) : (
          <View />
        )
      }
      renderItem={({ item }) => (
        <View style={columns > 1 ? styles.cardFlex : undefined}>
          <ListingCard listing={item} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', gap: spacing.md },
  list: { paddingVertical: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  row: { gap: spacing.lg },
  cardFlex: { flex: 1 },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  section: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginTop: spacing.lg,
  },
});
