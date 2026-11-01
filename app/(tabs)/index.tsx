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
} from 'react-native';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import type { ListingWithRelations } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/lib/useResponsive';

export default function HomeScreen() {
  const { isDemo } = useAuth();
  const { columns, isDesktop, isTablet, contentPad } = useResponsive();
  const [items, setItems] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

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
        contentContainerStyle={[
          styles.list,
          isDesktop && { maxWidth: layout.contentMax, alignSelf: 'center', width: '100%' },
        ]}
        columnWrapperStyle={columns > 1 ? [styles.row, { paddingHorizontal: contentPad }] : undefined}
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={[colors.heroFrom, colors.heroVia, colors.heroTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.hero,
                isDesktop && styles.heroDesktop,
                isTablet && !isDesktop && styles.heroTablet,
                { paddingHorizontal: contentPad },
              ]}
            >
              <View style={styles.heroOrb} />
              <View style={styles.heroOrbSmall} />
              <Text style={[styles.brand, isDesktop && styles.brandDesktop]}>MaterialLoop</Text>
              <Text style={[styles.headline, isDesktop && styles.headlineDesktop]}>
                Materialele rămase merită o a doua viață.
              </Text>
              <Text style={[styles.sub, isDesktop && styles.subDesktop]}>
                Cumpără, vinde sau oferă gratuit surplusul de construcții — în toată România.
              </Text>
              <View style={styles.ctaRow}>
                <Button
                  label="Explorează anunțuri"
                  variant="accent"
                  onPress={() => router.push('/search')}
                />
                <Pressable
                  accessibilityRole="button"
                  style={styles.ctaGhost}
                  onPress={() => router.push('/sell')}
                >
                  <Text style={styles.ctaGhostText}>Publică material</Text>
                </Pressable>
              </View>
            </LinearGradient>

            {isDemo ? (
              <View style={[styles.demoBanner, { marginHorizontal: contentPad }]}>
                <Text style={styles.demoText}>
                  Mod demonstrație local — datele rămân pe acest dispozitiv. Cont:
                  demo@materialloop.ro / demo1234
                </Text>
              </View>
            ) : null}

            <View style={[styles.sectionHead, { paddingHorizontal: contentPad }]}>
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
          <View
            style={[
              styles.cardWrap,
              { paddingHorizontal: columns === 1 ? contentPad : 0 },
              columns > 1 ? styles.cardFlex : null,
            ]}
          >
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
  row: { gap: spacing.lg },
  hero: {
    paddingTop: spacing.xxxl + 20,
    paddingBottom: spacing.xxl,
    minHeight: 380,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  heroTablet: { minHeight: 340 },
  heroDesktop: {
    minHeight: 420,
    marginTop: spacing.lg,
    marginHorizontal: spacing.xxl,
    borderRadius: radii.xl,
    paddingTop: spacing.xxxl,
  },
  heroOrb: {
    position: 'absolute',
    right: -50,
    top: -30,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroOrbSmall: {
    position: 'absolute',
    right: 80,
    bottom: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(184,90,42,0.25)',
  },
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 36,
    color: colors.white,
    marginBottom: spacing.md,
  },
  brandDesktop: { fontSize: 48 },
  headline: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 32,
    color: colors.white,
    maxWidth: 440,
    marginBottom: spacing.sm,
  },
  headlineDesktop: { fontSize: 32, lineHeight: 40, maxWidth: 560 },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 440,
    marginBottom: spacing.xl,
  },
  subDesktop: { fontSize: 17, lineHeight: 26, maxWidth: 520 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' },
  ctaGhost: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaGhostText: { fontFamily: fonts.sansBold, color: colors.white, fontSize: 15 },
  demoBanner: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E8C9B5',
  },
  demoText: { fontFamily: fonts.sans, color: colors.ink, fontSize: 13, lineHeight: 20 },
  sectionHead: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  link: { fontFamily: fonts.sansMedium, color: colors.brand, fontSize: 14 },
  cardWrap: {},
  cardFlex: { flex: 1 },
});
