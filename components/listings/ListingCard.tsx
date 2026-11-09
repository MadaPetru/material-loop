import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '@/contexts/LocaleContext';
import { resolveListingCoverUrl } from '@/lib/defaultListingPhoto';
import { formatPrice, formatQuantity, statusLabel } from '@/lib/labels';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { ListingStatus, ListingWithRelations } from '@/lib/types';
import { formatCityCounty } from '@/data/romania';

function unavailableCopy(
  status: ListingStatus,
  t: (key: string) => string
): { short: string; full: string; badge: string } | null {
  if (status === 'sold') {
    return {
      badge: statusLabel(status),
      short: t('listing.unavailableShortSold'),
      full: t('listing.unavailableSold'),
    };
  }
  if (status === 'given_away') {
    return {
      badge: statusLabel(status),
      short: t('listing.unavailableShortGiven'),
      full: t('listing.unavailableGiven'),
    };
  }
  if (status === 'reserved') {
    return {
      badge: statusLabel(status),
      short: t('listing.unavailableShortReserved'),
      full: t('listing.unavailableReserved'),
    };
  }
  return null;
}

export function ListingCard({ listing }: { listing: ListingWithRelations }) {
  const { t, locale } = useLocale();
  const [hovered, setHovered] = useState(false);
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
  const unavailable = unavailableCopy(listing.status, t);

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={
          unavailable
            ? `${listing.title}, ${price}. ${unavailable.full}`
            : `${listing.title}, ${price}`
        }
        accessibilityHint={unavailable?.full}
        // Native browser tooltip on web hover
        {...(Platform.OS === 'web' && unavailable
          ? ({ title: unavailable.full } as object)
          : null)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          styles.card,
          unavailable && styles.cardUnavailable,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: photo }}
            style={[styles.image, unavailable && styles.imageDimmed]}
            contentFit="cover"
            transition={200}
          />
          {listing.isFree && !unavailable ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('common.free')}</Text>
            </View>
          ) : null}
          {unavailable ? (
            <View style={[styles.badge, styles.statusBadge]}>
              <Text style={styles.badgeText}>{unavailable.badge}</Text>
            </View>
          ) : null}
          {unavailable && hovered ? (
            <View style={styles.hoverBanner} pointerEvents="none">
              <Text style={styles.hoverBannerText} numberOfLines={2}>
                {unavailable.full}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <Text style={[styles.price, unavailable && styles.priceMuted]}>{price}</Text>
          <Text numberOfLines={2} style={styles.title}>
            {listing.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {qty} · {place}
            {distance}
          </Text>
          {unavailable ? (
            <Text style={styles.unavailableLine} numberOfLines={1}>
              {unavailable.short}
            </Text>
          ) : null}
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
  cardUnavailable: {
    borderColor: colors.accentSoft,
  },
  pressed: { opacity: 0.94, transform: [{ translateY: 1 }] },
  imageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.mapDust,
  },
  image: { width: '100%', height: '100%' },
  imageDimmed: { opacity: 0.72 },
  badge: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  statusBadge: {
    backgroundColor: colors.accent,
  },
  badgeText: { color: colors.white, fontFamily: fonts.sansBold, fontSize: 12 },
  hoverBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(21, 32, 24, 0.82)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hoverBannerText: {
    color: colors.white,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  body: { padding: spacing.lg, gap: spacing.xs },
  price: { fontFamily: fonts.sansBold, color: colors.accent, fontSize: 17 },
  priceMuted: { color: colors.inkMuted },
  title: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 15, lineHeight: 21 },
  meta: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
  unavailableLine: {
    fontFamily: fonts.sansMedium,
    color: colors.accent,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
