import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ListingCard } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { marketplace } from '@/lib/api/marketplace';
import { colors, layout, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import type { ListingWithRelations } from '@/lib/types';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const { columns, contentPad, isDesktop } = useResponsive();
  const [items, setItems] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    marketplace
      .getFavorites(user.id)
      .then((res) => {
        if (active) setItems(res);
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
          title="Salvează anunțurile care te interesează"
          subtitle="Autentifică-te pentru a vedea favoritele."
          actionLabel="Autentificare"
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
      data={items}
      key={columns}
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
          title="Nicio favorită încă"
          subtitle="Atinge inima pe un anunț pentru a-l salva aici."
          actionLabel="Caută materiale"
          onAction={() => router.push('/search')}
        />
      }
      renderItem={({ item }) => (
        <View style={columns > 1 ? styles.cardFlex : undefined}>
          <ListingCard listing={item} />
        </View>
      )}
      ListFooterComponent={
        items.length ? (
          <Button
            label="Caută mai multe"
            variant="secondary"
            onPress={() => router.push('/search')}
            style={{ marginTop: spacing.md }}
          />
        ) : undefined
      }
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
