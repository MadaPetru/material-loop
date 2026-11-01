import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatPrice, formatQuantity } from '@/lib/labels';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { ListingWithRelations } from '@/lib/types';
import { formatCityCounty } from '@/data/romania';

export function ListingCard({ listing }: { listing: ListingWithRelations }) {
  const photo = listing.photos[0]?.url;
  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${listing.title}, ${formatPrice(listing.price, listing.currency, listing.isFree)}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.imageWrap}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.image} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>Fără foto</Text>
            </View>
          )}
          {listing.isFree ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Gratuit</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <Text style={styles.price}>
            {formatPrice(listing.price, listing.currency, listing.isFree)}
          </Text>
          <Text numberOfLines={2} style={styles.title}>
            {listing.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatQuantity(listing.quantity, listing.unit)} · {formatCityCounty(listing.cityId)}
            {listing.distanceKm != null ? ` · ${listing.distanceKm.toFixed(0)} km` : ''}
          </Text>
        </View>
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
  pressed: { opacity: 0.94, transform: [{ translateY: 1 }] },
  imageWrap: { height: 168, backgroundColor: colors.mapDust },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontFamily: fonts.sans, color: colors.inkMuted },
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
  price: { fontFamily: fonts.sansBold, color: colors.accent, fontSize: 17 },
  title: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 15, lineHeight: 21 },
  meta: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 12 },
});
