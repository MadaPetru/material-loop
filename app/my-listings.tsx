import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import type { ListingStatus, ListingWithRelations } from '@/lib/types';

type StatusFilter = 'all' | ListingStatus;

const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'draft', 'reserved', 'sold', 'expired'];

export default function MyListingsScreen() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { columns, contentPad, isDesktop } = useResponsive();
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('all');

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

  const filtered = useMemo(() => {
    if (status === 'all') return listings;
    return listings.filter((l) => l.status === status);
  }, [listings, status]);

  if (!user) {
    return (
      <View style={styles.center}>
        <EmptyState
          title={t('myListings.gateTitle')}
          subtitle={t('myListings.gateSub')}
          actionLabel={t('nav.login')}
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  if (loading) {
    return <ActivityIndicator color={colors.brand} style={{ marginTop: 48 }} />;
  }

  const statusLabel = (s: StatusFilter) => {
    if (s === 'all') return t('common.all');
    if (s === 'active') return t('myListings.filterActive');
    if (s === 'draft') return t('myListings.filterDraft');
    if (s === 'reserved') return t('myListings.filterReserved');
    if (s === 'sold') return t('myListings.filterSold');
    if (s === 'expired') return t('myListings.filterExpired');
    return s;
  };

  return (
    <FlatList
      style={styles.root}
      data={filtered}
      key={`${columns}-${locale}-${status}`}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.list,
        { paddingHorizontal: contentPad },
        isDesktop && { maxWidth: layout.contentMax, alignSelf: 'center', width: '100%' },
      ]}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      ListEmptyComponent={
        <EmptyState
          title={status === 'all' ? t('myListings.emptyTitle') : t('myListings.emptyFiltered')}
          subtitle={status === 'all' ? t('myListings.emptySub') : t('myListings.emptyFilteredSub')}
          actionLabel={status === 'all' ? t('myListings.create') : t('common.all')}
          onAction={
            status === 'all'
              ? () => router.push('/listing/create')
              : () => setStatus('all')
          }
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Button
            label={t('myListings.create')}
            onPress={() => router.push('/listing/create')}
          />
          <View style={styles.filters}>
            {STATUS_FILTERS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[styles.chip, status === s && styles.chipOn]}
              >
                <Text style={[styles.chipText, status === s && styles.chipTextOn]}>
                  {statusLabel(s)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.count}>
            {t('sell.listingsCount', { count: String(filtered.length) })}
          </Text>
        </View>
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
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  list: { paddingVertical: spacing.lg, gap: spacing.lg, flexGrow: 1, paddingBottom: 48 },
  row: { gap: spacing.lg },
  cardFlex: { flex: 1 },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
  },
  chipOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.inkMuted },
  chipTextOn: { color: colors.brandDark, fontFamily: fonts.sansBold },
  count: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
});
