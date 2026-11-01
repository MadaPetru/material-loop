import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { formatCityCounty } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { marketplace } from '@/lib/api/marketplace';
import { conditionLabels, formatPrice, formatQuantity, statusLabels } from '@/lib/labels';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { ListingWithRelations } from '@/lib/types';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      marketplace.getListing(String(id)),
      user ? marketplace.isFavorite(user.id, String(id)) : Promise.resolve(false),
    ])
      .then(([item, fav]) => {
        if (!active) return;
        setListing(item);
        setFavorite(fav);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, user]);

  if (loading) {
    return <ActivityIndicator color={colors.brand} style={{ marginTop: 48 }} />;
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Anunțul nu a fost găsit.</Text>
      </View>
    );
  }

  const isOwner = user?.id === listing.sellerId;
  const photo = listing.photos[0]?.url;

  const toggleFavorite = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    const next = await marketplace.toggleFavorite(user.id, listing.id);
    setFavorite(next);
  };

  const share = async () => {
    await Share.share({
      message: `${listing.title} — ${formatPrice(listing.price, listing.currency, listing.isFree)} pe MaterialLoop`,
    });
  };

  const markStatus = async (status: 'sold' | 'given_away' | 'reserved' | 'active' | 'removed') => {
    if (!user) return;
    await marketplace.setListingStatus(listing.id, user.id, status);
    const refreshed = await marketplace.getListing(listing.id);
    setListing(refreshed);
    Alert.alert('Actualizat', `Status: ${statusLabels[status]}`);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 48 }}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.hero} contentFit="cover" />
      ) : (
        <View style={[styles.hero, styles.heroEmpty]}>
          <Text style={styles.heroEmptyText}>Fără fotografie</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.price}>
          {formatPrice(listing.price, listing.currency, listing.isFree)}
          {listing.isNegotiable ? ' · negociabil' : ''}
        </Text>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.meta}>
          {formatQuantity(listing.quantity, listing.unit)} · {conditionLabels[listing.condition]}
        </Text>
        <Text style={styles.meta}>
          {formatCityCounty(listing.cityId)} · locație aproximativă
        </Text>
        <Text style={styles.meta}>
          {listing.category?.name}
          {listing.subcategory ? ` / ${listing.subcategory.name}` : ''}
          {listing.brand ? ` · ${listing.brand}` : ''}
          {listing.model ? ` ${listing.model}` : ''}
        </Text>
        <Text style={styles.status}>Status: {statusLabels[listing.status]}</Text>

        <Text style={styles.section}>Descriere</Text>
        <Text style={styles.description}>{listing.description}</Text>

        {listing.storageNotes ? (
          <>
            <Text style={styles.section}>Depozitare / siguranță</Text>
            <Text style={styles.description}>{listing.storageNotes}</Text>
          </>
        ) : null}

        <Text style={styles.section}>Ridicare & livrare</Text>
        <Text style={styles.description}>
          {listing.pickupAvailable ? 'Ridicare disponibilă. ' : ''}
          {listing.deliveryAvailable ? 'Livrare posibilă (detalii cu vânzătorul).' : 'Fără livrare.'}
        </Text>
        <Text style={styles.disclaimer}>
          Adresa exactă se comunică privat. MaterialLoop nu garantează starea materialelor și nu
          intermediază plăți.
        </Text>

        {listing.seller ? (
          <Link href={`/u/${listing.seller.id}`} asChild>
            <Pressable style={styles.seller}>
              <Text style={styles.sellerName}>{listing.seller.displayName}</Text>
              <Text style={styles.meta}>
                {listing.seller.sellerRating != null
                  ? `★ ${listing.seller.sellerRating.toFixed(1)} · ${listing.seller.completedSales} vânzări`
                  : 'Vânzător nou'}
              </Text>
            </Pressable>
          </Link>
        ) : null}

        <View style={styles.actions}>
          <Button
            label={favorite ? 'Elimină din favorite' : 'Adaugă la favorite'}
            variant="secondary"
            onPress={toggleFavorite}
          />
          <Button label="Distribuie" variant="secondary" onPress={share} />
          {!isOwner ? (
            <Button
              label="Contactează vânzătorul"
              onPress={() =>
                Alert.alert(
                  'În curând',
                  'Mesageria vine în etapa următoare. Poți salva anunțul la favorite între timp.'
                )
              }
            />
          ) : (
            <>
              <Button label="Editează" onPress={() => router.push(`/listing/${listing.id}/edit`)} />
              <Button label="Marchează rezervat" variant="secondary" onPress={() => markStatus('reserved')} />
              <Button
                label={listing.isFree ? 'Marchează oferit' : 'Marchează vândut'}
                onPress={() => markStatus(listing.isFree ? 'given_away' : 'sold')}
              />
              <Button label="Reactivează" variant="ghost" onPress={() => markStatus('active')} />
              <Button label="Șterge anunț" variant="danger" onPress={() => markStatus('removed')} />
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { fontFamily: fonts.sans, color: colors.inkMuted },
  hero: { width: '100%', height: 280, backgroundColor: colors.mapDust },
  heroEmpty: { alignItems: 'center', justifyContent: 'center' },
  heroEmptyText: { fontFamily: fonts.sans, color: colors.inkMuted },
  body: { padding: spacing.xl, gap: spacing.sm },
  price: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.accent },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, lineHeight: 34 },
  meta: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 14 },
  status: { fontFamily: fonts.sansMedium, color: colors.brand, marginTop: spacing.xs },
  section: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginTop: spacing.lg,
  },
  description: { fontFamily: fonts.sans, color: colors.ink, fontSize: 16, lineHeight: 24 },
  disclaimer: {
    fontFamily: fonts.sans,
    color: colors.inkFaint,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  seller: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sellerName: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  actions: { gap: spacing.sm, marginTop: spacing.xl },
});
