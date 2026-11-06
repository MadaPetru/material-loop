import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { marketplace } from '@/lib/api/marketplace';
import { colors, layout, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import type { ListingWithRelations } from '@/lib/types';

export default function MyListingsScreen() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { columns, contentPad, isDesktop } = useResponsive();
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

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
      ListEmptyComponent={
        <EmptyState
          title={t('myListings.emptyTitle')}
          subtitle={t('myListings.emptySub')}
          actionLabel={t('myListings.create')}
          onAction={() => router.push('/listing/create')}
        />
      }
      ListHeaderComponent={
        listings.length ? (
          <Button
            label={t('myListings.create')}
            onPress={() => router.push('/listing/create')}
            style={{ marginBottom: spacing.sm }}
          />
        ) : undefined
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
});
