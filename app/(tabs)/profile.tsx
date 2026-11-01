import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCityCounty } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { ListingWithRelations } from '@/lib/types';

export default function ProfileScreen() {
  const { user, signOut, isDemo } = useAuth();
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
          title="Cont MaterialLoop"
          subtitle="Un singur cont pentru a cumpăra și a vinde materiale rămase."
          actionLabel="Autentificare"
          onAction={() => router.push('/(auth)/login')}
        />
        <Button
          label="Creează cont"
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
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 }}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.meta}>
            {user.cityId ? formatCityCounty(user.cityId) : 'Locație nesetată'} ·{' '}
            {user.accountType === 'business' ? 'Business' : 'Persoană fizică'}
          </Text>
          {user.sellerRating != null ? (
            <Text style={styles.meta}>
              Rating {user.sellerRating.toFixed(1)} ({user.ratingCount}) · {user.completedSales}{' '}
              vânzări
            </Text>
          ) : (
            <Text style={styles.meta}>Fără rating încă</Text>
          )}
          {isDemo ? (
            <Text style={styles.demo}>Mod demo — datele rămân pe acest dispozitiv.</Text>
          ) : null}
          <View style={styles.actions}>
            <Button label="Editează profil" variant="secondary" onPress={() => router.push('/profile/edit')} />
            <Button label="Publică anunț" onPress={() => router.push('/listing/create')} />
            <Button label="Deconectare" variant="ghost" onPress={() => signOut()} />
          </View>
          <Pressable onPress={() => router.push('/legal/terms')}>
            <Text style={styles.legal}>Termeni · Siguranță materiale</Text>
          </Pressable>
          <Text style={styles.section}>Anunțurile mele</Text>
          {loading ? <ActivityIndicator color={colors.brand} /> : null}
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <EmptyState
            title="Nu ai anunțuri active"
            subtitle="Publică primul material rămas — plătit sau gratuit."
            actionLabel="Creează anunț"
            onAction={() => router.push('/listing/create')}
          />
        ) : (
          <View />
        )
      }
      renderItem={({ item }) => <ListingCard listing={item} />}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', gap: spacing.md },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  name: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  meta: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 14 },
  demo: {
    fontFamily: fonts.sans,
    color: colors.accent,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
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
