import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { ListingCard } from '@/components/listings/ListingCard';
import { formatCityCounty } from '@/data/romania';
import { marketplace } from '@/lib/api/marketplace';
import { isPublicFeedListing } from '@/lib/listingVisibility';
import { publicFacingText } from '@/lib/publicListingCopy';
import { colors, fonts, spacing } from '@/lib/theme';
import type { ListingWithRelations, Profile } from '@/lib/types';

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([marketplace.getProfile(String(id)), marketplace.listingsForSeller(String(id))])
      .then(([p, l]) => {
        setProfile(p);
        setListings(l.filter((x) => isPublicFeedListing(x)));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />;
  if (!profile) {
    return (
      <View style={styles.root}>
        <Text style={styles.msg}>Profil indisponibil.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      data={listings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      ListHeaderComponent={
        <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.meta}>
            {profile.cityId ? formatCityCounty(profile.cityId) : 'România'} · membru din{' '}
            {new Date(profile.createdAt).toLocaleDateString('ro-RO')}
          </Text>
          <Text style={styles.meta}>
            {profile.sellerRating != null
              ? `★ ${profile.sellerRating.toFixed(1)} (${profile.ratingCount}) · ${profile.completedSales} vânzări`
              : 'Fără rating încă'}
          </Text>
          {publicFacingText(profile.bio, profile.isSeed) ? (
            <Text style={styles.bio}>{publicFacingText(profile.bio, profile.isSeed)}</Text>
          ) : null}
          <Text style={styles.section}>Anunțuri active ({listings.length})</Text>
        </View>
      }
      renderItem={({ item }) => <ListingCard listing={item} />}
      ListEmptyComponent={<Text style={styles.msg}>Niciun anunț activ.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  name: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  meta: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 14 },
  bio: { fontFamily: fonts.sans, color: colors.ink, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  section: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginTop: spacing.lg },
  msg: { fontFamily: fonts.sans, color: colors.inkMuted, padding: spacing.xl },
});
