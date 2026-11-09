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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCityCounty } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { marketplace } from '@/lib/api/marketplace';
import { resolveListingCoverUrl } from '@/lib/defaultListingPhoto';
import { conditionLabels, formatPrice, formatQuantity, statusLabels } from '@/lib/labels';
import { canContactListing } from '@/lib/listingVisibility';
import { publicFacingText } from '@/lib/publicListingCopy';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { toUserError } from '@/lib/userErrors';
import type { ListingStatus, ListingWithRelations } from '@/lib/types';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, can } = useAuth();
  const { t, locale } = useLocale();
  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyStatus, setBusyStatus] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
  const photo = resolveListingCoverUrl(
    listing.photos,
    listing.categoryId,
    listing.subcategoryId,
    locale
  );
  const canReactivate = listing.status !== 'active' && listing.status !== 'removed';
  const canMarkReserved = listing.status === 'active';
  const canMarkDone = listing.status === 'active' || listing.status === 'reserved';

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

  const markStatus = async (status: Extract<ListingStatus, 'sold' | 'given_away' | 'reserved' | 'active' | 'removed'>) => {
    if (!user || busyStatus) return;
    setBusyStatus(true);
    try {
      if (status === 'removed') {
        await marketplace.deleteListing(listing.id, user.id);
        setDeleteConfirmOpen(false);
        router.back();
        return;
      }
      await marketplace.setListingStatus(listing.id, user.id, status);
      const refreshed = await marketplace.getListing(listing.id);
      setListing(refreshed);
    } catch (e) {
      Alert.alert(t('common.error'), toUserError(e, t('errors.genericRetry')));
    } finally {
      setBusyStatus(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 56 }}>
      <Image source={{ uri: photo }} style={styles.hero} contentFit="cover" />

      <View style={styles.body}>
        <Text style={styles.price}>
          {formatPrice(listing.price, listing.currency, listing.isFree)}
          {listing.isNegotiable ? ` · ${t('listing.negotiable')}` : ''}
        </Text>
        <Text style={styles.title}>{listing.title}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{statusLabels[listing.status]}</Text>
          </View>
          {listing.isFree ? (
            <View style={[styles.statusPill, styles.freePill]}>
              <Text style={[styles.statusPillText, styles.freePillText]}>{t('common.free')}</Text>
            </View>
          ) : null}
        </View>

        {!canContactListing(listing) && !isOwner ? (
          <View style={styles.unavailableBanner}>
            <Text style={styles.unavailableBannerText}>
              {listing.status === 'sold'
                ? t('listing.unavailableSold')
                : listing.status === 'given_away'
                  ? t('listing.unavailableGiven')
                  : listing.status === 'reserved'
                    ? t('listing.unavailableReserved')
                    : t('listing.unavailableSold')}
            </Text>
          </View>
        ) : null}

        <Text style={styles.meta}>
          {formatQuantity(listing.quantity, listing.unit)} · {conditionLabels[listing.condition]}
        </Text>
        <Text style={styles.meta}>
          {formatCityCounty(listing.cityId)} · {t('listing.approxLocation')}
        </Text>
        <Text style={styles.meta}>
          {[listing.category?.name, listing.subcategory?.name, listing.brand, listing.model]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <Text style={styles.section}>{t('listing.description')}</Text>
        <Text style={styles.description}>
          {publicFacingText(listing.description, listing.isSeed)}
        </Text>

        {publicFacingText(listing.storageNotes, listing.isSeed) ? (
          <>
            <Text style={styles.section}>{t('listing.storage')}</Text>
            <Text style={styles.description}>
              {publicFacingText(listing.storageNotes, listing.isSeed)}
            </Text>
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

        <View style={styles.utilityRow}>
          {can('favorites.write') || !user ? (
            <Pressable
              accessibilityRole="button"
              onPress={toggleFavorite}
              style={[styles.utilityBtn, favorite && styles.utilityBtnActive]}
            >
              <Text style={[styles.utilityText, favorite && styles.utilityTextActive]}>
                {favorite ? t('listing.removeFavorite') : t('listing.addFavorite')}
              </Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={share} style={styles.utilityBtn}>
            <Text style={styles.utilityText}>{t('listing.share')}</Text>
          </Pressable>
        </View>

        {!isOwner ? (
          canContactListing(listing) && (can('messages.start') || !user) ? (
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
          ) : null
        ) : (
          <View style={styles.manageCard}>
            <Text style={styles.manageTitle}>{t('listing.manageTitle')}</Text>
            {can('listings.edit_own') ? (
              <Button
                label={t('listing.edit')}
                onPress={() => router.push(`/listing/${listing.id}/edit`)}
              />
            ) : null}
            {can('listings.status_own') && (canMarkReserved || canMarkDone || canReactivate) ? (
              <View style={styles.statusBlock}>
                <Text style={styles.statusHint}>{t('listing.statusHint')}</Text>
                <View style={styles.statusActions}>
                  {canMarkReserved ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={busyStatus}
                      onPress={() => markStatus('reserved')}
                      style={[styles.statusChip, busyStatus && styles.statusChipDisabled]}
                    >
                      <Text style={styles.statusChipText}>{t('listing.markReserved')}</Text>
                    </Pressable>
                  ) : null}
                  {canMarkDone ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={busyStatus}
                      onPress={() => markStatus(listing.isFree ? 'given_away' : 'sold')}
                      style={[styles.statusChip, busyStatus && styles.statusChipDisabled]}
                    >
                      <Text style={styles.statusChipText}>
                        {listing.isFree ? t('listing.markGiven') : t('listing.markSold')}
                      </Text>
                    </Pressable>
                  ) : null}
                  {canReactivate ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={busyStatus}
                      onPress={() => markStatus('active')}
                      style={[styles.statusChip, styles.statusChipAccent, busyStatus && styles.statusChipDisabled]}
                    >
                      <Text style={[styles.statusChipText, styles.statusChipAccentText]}>
                        {t('listing.reactivate')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}
            {can('listings.delete_own') ? (
              <Pressable
                accessibilityRole="button"
                disabled={busyStatus}
                onPress={() => setDeleteConfirmOpen(true)}
                style={styles.deleteLink}
              >
                <Text style={styles.deleteLinkText}>{t('listing.delete')}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>

      <ConfirmDialog
        visible={deleteConfirmOpen}
        title={t('listing.deleteConfirmTitle')}
        message={t('listing.deleteConfirmBody')}
        confirmLabel={busyStatus ? t('common.loading') : t('listing.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        busy={busyStatus}
        onCancel={() => {
          if (!busyStatus) setDeleteConfirmOpen(false);
        }}
        onConfirm={() => {
          void markStatus('removed');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { fontFamily: fonts.sans, color: colors.inkMuted },
  hero: { width: '100%', height: 280, backgroundColor: colors.mapDust },
  body: { padding: spacing.xl, gap: spacing.sm },
  price: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.accent },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, lineHeight: 34 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  statusPill: {
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  statusPillText: { fontFamily: fonts.sansBold, color: colors.brandDark, fontSize: 12 },
  freePill: { backgroundColor: colors.accentSoft },
  freePillText: { color: colors.accent },
  unavailableBanner: {
    marginTop: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  unavailableBannerText: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 14, lineHeight: 20 },
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
  utilityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  utilityBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityBtnActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  utilityText: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 14 },
  utilityTextActive: { color: colors.brandDark, fontFamily: fonts.sansBold },
  manageCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
  },
  manageTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  statusBlock: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  statusHint: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  statusChipAccent: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  statusChipDisabled: { opacity: 0.45 },
  statusChipText: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    fontSize: 13,
  },
  statusChipAccentText: {
    color: colors.brandDark,
    fontFamily: fonts.sansBold,
  },
  deleteLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  deleteLinkText: {
    fontFamily: fonts.sansMedium,
    color: colors.danger,
    fontSize: 14,
  },
});
