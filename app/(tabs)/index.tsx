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
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import type { ListingWithRelations } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useResponsive } from '@/lib/useResponsive';

export default function HomeScreen() {
  const { isDemo } = useAuth();
  const { t, locale } = useLocale();
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
        key={`${columns}-${locale}`}
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
              {!isDesktop ? (
                <View style={styles.langRow}>
                  <LanguageSelector />
                </View>
              ) : null}
              <Text style={[styles.brand, isDesktop && styles.brandDesktop]}>{t('common.brand')}</Text>
              <Text style={[styles.headline, isDesktop && styles.headlineDesktop]}>
                {t('home.headline')}
              </Text>
              <Text style={[styles.sub, isDesktop && styles.subDesktop]}>{t('home.sub')}</Text>
              <View style={styles.ctaRow}>
                <Button
                  label={t('home.explore')}
                  variant="accent"
                  onPress={() => router.push('/search')}
                />
                <Pressable
                  accessibilityRole="button"
                  style={styles.ctaGhost}
                  onPress={() => router.push('/sell')}
                >
                  <Text style={styles.ctaGhostText}>{t('home.publish')}</Text>
                </Pressable>
              </View>
            </LinearGradient>

            {isDemo ? (
              <View style={[styles.demoBanner, { marginHorizontal: contentPad }]}>
                <Text style={styles.demoText}>{t('home.demoBanner')}</Text>
              </View>
            ) : null}

            <View style={[styles.sectionHead, { paddingHorizontal: contentPad }]}>
              <Text style={styles.sectionTitle}>{t('home.recent')}</Text>
              <Link href="/search" style={styles.link}>
                {t('home.seeAll')}
              </Link>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              title={t('home.emptyTitle')}
              subtitle={t('home.emptySub')}
              actionLabel={t('home.emptyAction')}
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
  langRow: { alignSelf: 'flex-start', marginBottom: spacing.md },
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
