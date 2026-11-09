import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '@/contexts/LocaleContext';
import { resolveListingCoverUrl } from '@/lib/defaultListingPhoto';
import { formatPrice, formatQuantity, statusLabel } from '@/lib/labels';
import { isSeedOfferedListing } from '@/lib/listingVisibility';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { ListingWithRelations } from '@/lib/types';
import { formatCityCounty } from '@/data/romania';

export function ListingCard({ listing }: { listing: ListingWithRelations }) {
  const { t, locale } = useLocale();
  const photo = resolveListingCoverUrl(
    listing.photos,
    listing.categoryId,
    listing.subcategoryId,
    locale
  );
  const price = formatPrice(listing.price, listing.currency, listing.isFree);
  const place = formatCityCounty(listing.cityId);
  const qty = formatQuantity(listing.quantity, listing.unit);
  const distance =
    listing.distanceKm != null ? ` · ${listing.distanceKm.toFixed(0)} km` : '';
  const seedOffered = isSeedOfferedListing(listing);
  const offeredLabel = seedOffered ? statusLabel(listing.status) : null;

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${listing.title}, ${price}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.imageWrap}>
          <Image source={{ uri: photo }} style={styles.image} contentFit="cover" transition={200} />
          {listing.isFree ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('common.free')}</Text>
            </View>
          ) : null}
          {listing.isSeed ? (
            <View style={[styles.badge, styles.seedBadge, listing.isFree && styles.seedBadgeOffset]}>
              <Text style={styles.badgeText}>
                {offeredLabel ? `${t('listing.seedBadge')} · ${offeredLabel}` : t('listing.seedBadge')}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <Text style={styles.price}>{price}</Text>
          <Text numberOfLines={2} style={styles.title}>
            {listing.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {qty} · {place}
            {distance}
            {offeredLabel ? ` · ${offeredLabel}` : ''}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  pressed: { opacity: 0.94, transform: [{ translateY: 1 }] },
  imageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.mapDust,
  },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  seedBadge: {
    backgroundColor: colors.accent,
  },
  seedBadgeOffset: {
    top: spacing.md + 28,
  },
  badgeText: { color: colors.white, fontFamily: fonts.sansBold, fontSize: 12 },
  body: { padding: spacing.lg, gap: spacing.xs },
  price: { fontFamily: fonts.sansBold, color: colors.accent, fontSize: 17 },
  title: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 15, lineHeight: 21 },
  meta: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
});