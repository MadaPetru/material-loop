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
import { useLocale } from '@/contexts/LocaleContext';
import { marketplace } from '@/lib/api/marketplace';
import { conditionLabels, formatPrice, formatQuantity, statusLabels } from '@/lib/labels';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { ListingWithRelations } from '@/lib/types';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLocale();
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
        <Text style={styles.missing}>{t('listing.missing')}</Text>
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
      message: t('listing.shareMessage', {
        title: listing.title,
        price: formatPrice(listing.price, listing.currency, listing.isFree),
      }),
    });
  };

  const markStatus = async (status: 'sold' | 'given_away' | 'reserved' | 'active' | 'removed') => {
    if (!user) return;
    await marketplace.setListingStatus(listing.id, user.id, status);
    const refreshed = await marketplace.getListing(listing.id);
    setListing(refreshed);
    Alert.alert(t('common.updated'), t('listing.status', { status: statusLabels[status] }));
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 48 }}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.hero} contentFit="cover" />
      ) : (
        <View style={[styles.hero, styles.heroEmpty]}>
          <Text style={styles.heroEmptyText}>{t('listing.noPhoto')}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.price}>
          {formatPrice(listing.price, listing.currency, listing.isFree)}
          {listing.isNegotiable ? ` · ${t('listing.negotiable')}` : ''}
        </Text>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.meta}>
          {formatQuantity(listing.quantity, listing.unit)} · {conditionLabels[listing.condition]}
        </Text>
        <Text style={styles.meta}>
          {formatCityCounty(listing.cityId)} · {t('listing.approxLocation')}
        </Text>
        <Text style={styles.meta}>
          {listing.category?.name}
          {listing.subcategory ? ` / ${listing.subcategory.name}` : ''}
          {listing.brand ? ` · ${listing.brand}` : ''}
          {listing.model ? ` ${listing.model}` : ''}
        </Text>
        <Text style={styles.status}>
          {t('listing.status', { status: statusLabels[listing.status] })}
        </Text>

        <Text style={styles.section}>{t('listing.description')}</Text>
        <Text style={styles.description}>{listing.description}</Text>

        {listing.storageNotes ? (
          <>
            <Text style={styles.section}>{t('listing.storage')}</Text>
            <Text style={styles.description}>{listing.storageNotes}</Text>
          </>
        ) : null}

        <Text style={styles.section}>{t('listing.pickupDelivery')}</Text>
        <Text style={styles.description}>
          {listing.pickupAvailable ? t('listing.pickupAvailable') : ''}
          {listing.deliveryAvailable ? t('listing.deliveryPossible') : t('listing.noDelivery')}
        </Text>
        <Text style={styles.disclaimer}>{t('listing.disclaimer')}</Text>

        {listing.seller ? (
          <Link href={`/u/${listing.seller.id}`} asChild>
            <Pressable style={styles.seller}>
              <Text style={styles.sellerName}>{listing.seller.displayName}</Text>
              <Text style={styles.meta}>
                {listing.seller.sellerRating != null
                  ? t('listing.sellerRatingLine', {
                      rating: listing.seller.sellerRating.toFixed(1),
                      sales: listing.seller.completedSales,
                    })
                  : t('listing.newSeller')}
              </Text>
            </Pressable>
          </Link>
        ) : null}

        <View style={styles.actions}>
          <Button
            label={favorite ? t('listing.removeFavorite') : t('listing.addFavorite')}
            variant="secondary"
            onPress={toggleFavorite}
          />
          <Button label={t('listing.share')} variant="secondary" onPress={share} />
          {!isOwner ? (
            <Button
              label={t('listing.contactSeller')}
              onPress={async () => {
                if (!user) {
                  router.push('/(auth)/login');
                  return;
                }
                try {
                  const conversation = await marketplace.startConversation({
                    listingId: listing.id,
                    buyerId: user.id,
                    sellerId: listing.sellerId,
                    initialMessage: t('messages.contactStarter', { title: listing.title }),
                  });
                  router.push({
                    pathname: '/(tabs)/messages',
                    params: { conversationId: conversation.id },
                  });
                } catch (e) {
                  Alert.alert(
                    t('nav.messages'),
                    e instanceof Error ? e.message : t('listing.contactFailed')
                  );
                }
              }}
            />
          ) : (
            <>
              <Button label={t('listing.edit')} onPress={() => router.push(`/listing/${listing.id}/edit`)} />
              <Button
                label={t('listing.markReserved')}
                variant="secondary"
                onPress={() => markStatus('reserved')}
              />
              <Button
                label={listing.isFree ? t('listing.markGiven') : t('listing.markSold')}
                onPress={() => markStatus(listing.isFree ? 'given_away' : 'sold')}
              />
              <Button
                label={t('listing.reactivate')}
                variant="ghost"
                onPress={() => markStatus('active')}
              />
              <Button
                label={t('listing.delete')}
                variant="danger"
                onPress={() => markStatus('removed')}
              />
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
