import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '@/contexts/LocaleContext';
import { conditionLabel, formatPrice, formatQuantity } from '@/lib/labels';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { ListingWithRelations } from '@/lib/types';
import { formatCityCounty } from '@/data/romania';

export function ListingCard({ listing }: { listing: ListingWithRelations }) {
  const { t } = useLocale();
  const photo = listing.photos[0]?.url;
  const price = formatPrice(listing.price, listing.currency, listing.isFree);
  const place = formatCityCounty(listing.cityId);
  const qty = formatQuantity(listing.quantity, listing.unit);
  const distance =
    listing.distanceKm != null ? ` · ${listing.distanceKm.toFixed(0)} km` : '';
  const category = listing.category?.name;
  const condition = conditionLabel(listing.condition);

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${listing.title}, ${price}`}
        style={({ pressed }) => [
          photo ? styles.card : styles.cardText,
          pressed && styles.pressed,
        ]}
      >
        {photo ? (
          <>
            <View style={styles.imageWrap}>
              <Image source={{ uri: photo }} style={styles.image} contentFit="cover" transition={200} />
              {listing.isFree ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('common.free')}</Text>
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
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.textRow}>
            <View style={styles.accentBar} />
            <View style={styles.textBody}>
              <View style={styles.textTop}>
                <Text style={styles.price}>{price}</Text>
                {listing.isFree ? (
                  <View style={styles.inlineBadge}>
                    <Text style={styles.inlineBadgeText}>{t('common.free')}</Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={2} style={styles.titleText}>
                {listing.title}
              </Text>
              {listing.description ? (
                <Text numberOfLines={2} style={styles.excerpt}>
                  {listing.description}
                </Text>
              ) : null}
              <Text style={styles.meta} numberOfLines={2}>
                {[category, condition, qty, place].filter(Boolean).join(' · ')}
                {distance}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  cardText: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadows.soft,
  },
  pressed: { opacity: 0.94, transform: [{ translateY: 1 }] },
  imageWrap: { height: 168, backgroundColor: colors.mapDust },
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
  badgeText: { color: colors.white, fontFamily: fonts.sansBold, fontSize: 12 },
  body: { padding: spacing.lg, gap: spacing.xs },
  textRow: { flexDirection: 'row', minHeight: 112 },
  accentBar: {
    width: 5,
    backgroundColor: colors.brand,
  },
  textBody: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 4,
    justifyContent: 'center',
  },
  textTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  inlineBadge: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  inlineBadgeText: {
    color: colors.brandDark,
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  price: { fontFamily: fonts.sansBold, color: colors.accent, fontSize: 17 },
  title: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 15, lineHeight: 21 },
  titleText: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 18,
    lineHeight: 24,
  },
  excerpt: {
    fontFamily: fonts.sans,
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 12, lineHeight: 17 },
});
