import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import type { ListingWithRelations } from '@/lib/types';

export default function SellTab() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { columns, contentPad, isDesktop } = useResponsive();
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) {
        setListings([]);
        setLoading(false);
        return () => {
          active = false;
        };
      }
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
    }, [user]),
  );

  const header = (
    <View style={[styles.panel, isDesktop && styles.panelDesktop]}>
      <Text style={styles.eyebrow}>{t('sell.eyebrow')}</Text>
      <Text style={styles.brand}>{t('common.brand')}</Text>
      <Text style={styles.title}>{t('sell.title')}</Text>
      <Text style={styles.sub}>{t('sell.sub')}</Text>
      <Button
        label={user ? t('sell.create') : t('sell.loginToSell')}
        onPress={() => router.push(user ? '/listing/create' : '/(auth)/login')}
      />
      {user ? (
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('sell.myListingsTitle')}</Text>
          {listings.length ? (
            <Text style={styles.sectionCount}>
              {t('sell.listingsCount', { count: listings.length })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  if (!user) {
    return (
      <View style={styles.root}>
        <View
          style={[
            styles.guestWrap,
            { paddingHorizontal: contentPad },
            isDesktop && { maxWidth: layout.contentMax, alignSelf: 'center', width: '100%' },
          ]}
        >
          {header}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      data={loading ? [] : listings}
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
        <View>
          {header}
          {loading ? <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.lg }} /> : null}
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <EmptyState
            title={t('myListings.emptyTitle')}
            subtitle={t('myListings.emptySub')}
            actionLabel={t('myListings.create')}
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
  guestWrap: { flexGrow: 1 },
  list: { paddingVertical: spacing.lg, gap: spacing.lg, flexGrow: 1, paddingBottom: 48 },
  row: { gap: spacing.lg },
  cardFlex: { flex: 1 },
  panel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
  },
  panelDesktop: {
    marginTop: spacing.xl,
    padding: spacing.xxl,
  },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  brand: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.brand },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, lineHeight: 36 },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.inkMuted,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  sectionHead: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: spacing.xs,
  },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  sectionCount: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
});
