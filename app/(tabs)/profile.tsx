import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LanguageHint } from '@/components/ui/LanguageHint';
import { formatCityCounty } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import type { ListingWithRelations } from '@/lib/types';

export default function ProfileScreen() {
  const { user, signOut, isDemo } = useAuth();
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
      key={columns}
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
            {!isDesktop ? <LanguageHint /> : null}
          </View>
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
            <Text style={styles.meta}>Fără rating încă — completează profilul și publică anunțuri.</Text>
          )}
          {isDemo ? (
            <Text style={styles.demo}>Mod demo — datele rămân pe acest dispozitiv.</Text>
          ) : null}
          <View style={[styles.actions, isDesktop && styles.actionsRow]}>
            <Button
              label="Editează profil"
              variant="secondary"
              onPress={() => router.push('/profile/edit')}
              style={isDesktop ? styles.actionFlex : undefined}
            />
            <Button
              label="Publică anunț"
              onPress={() => router.push('/listing/create')}
              style={isDesktop ? styles.actionFlex : undefined}
            />
            <Button
              label="Deconectare"
              variant="ghost"
              onPress={() => signOut()}
              style={isDesktop ? styles.actionFlex : undefined}
            />
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
