import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ListingCard } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { ListingWithRelations } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { isDemo } = useAuth();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const columns = width >= 900 ? 3 : width >= 640 ? 2 : 1;

  useEffect(() => {
    let active = true;
    setLoading(true);
    marketplace
      .search({ sort: 'newest', pageSize: 24, countryWide: true })
      .then((res) => {
        if (active) setItems(res.items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      <FlatList
        data={items}
        key={columns}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={['#2F5D3A', '#1F3F28', '#3D4A32']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroPattern} />
              <Text style={styles.brand}>MaterialLoop</Text>
              <Text style={styles.headline}>Materialele rămase merită o a doua viață.</Text>
              <Text style={styles.sub}>
                Cumpără, vinde sau oferă gratuit surplusul de construcții — în toată România.
              </Text>
              <View style={styles.ctaRow}>
                <Pressable style={styles.ctaPrimary} onPress={() => router.push('/search')}>
                  <Text style={styles.ctaPrimaryText}>Explorează anunțuri</Text>
                </Pressable>
                <Pressable style={styles.ctaSecondary} onPress={() => router.push('/sell')}>
                  <Text style={styles.ctaSecondaryText}>Publică material</Text>
                </Pressable>
              </View>
            </LinearGradient>

            {isDemo ? (
              <View style={styles.demoBanner}>
                <Text style={styles.demoText}>
                  Mod demonstrație local — conectează Supabase când ești gata (vezi README). Cont:
                  demo@materialloop.ro / demo1234
                </Text>
              </View>
            ) : null}

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Anunțuri recente</Text>
              <Link href="/search" style={styles.link}>
                Vezi toate
              </Link>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              title="Încă nu sunt anunțuri"
              subtitle="Fii primul care publică materiale rămase în zona ta."
              actionLabel="Publică acum"
              onAction={() => router.push('/sell')}
            />
          )
        }
        renderItem={({ item }) => (
          <View style={[styles.cardWrap, columns > 1 ? styles.cardFlex : null]}>
            <ListingCard listing={item} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { paddingBottom: spacing.xxxl, gap: spacing.lg },
  row: { gap: spacing.lg, paddingHorizontal: spacing.lg },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl + 12,
    paddingBottom: spacing.xxl,
    minHeight: 420,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroPattern: {
    position: 'absolute',
    right: -40,
    top: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 42,
    color: colors.white,
    marginBottom: spacing.md,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 34,
    color: colors.white,
    maxWidth: 420,
    marginBottom: spacing.sm,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.86)',
    maxWidth: 440,
    marginBottom: spacing.xl,
  },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  ctaPrimary: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  ctaPrimaryText: { fontFamily: fonts.sansBold, color: colors.white, fontSize: 15 },
  ctaSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  ctaSecondaryText: { fontFamily: fonts.sansBold, color: colors.white, fontSize: 15 },
  demoBanner: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E8C9B5',
  },
  demoText: { fontFamily: fonts.sans, color: colors.ink, fontSize: 13, lineHeight: 20 },
  sectionHead: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  link: { fontFamily: fonts.sansMedium, color: colors.brand, fontSize: 14 },
  cardWrap: { paddingHorizontal: spacing.lg },
  cardFlex: { flex: 1 },
});
