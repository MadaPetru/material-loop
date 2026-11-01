import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LocationPicker } from '@/components/LocationPicker';
import { ListingCard } from '@/components/listings/ListingCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CATEGORIES } from '@/data/categories';
import { getCity, getCounty } from '@/data/romania';
import { marketplace } from '@/lib/api/marketplace';
import { radiusOptions } from '@/lib/labels';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import { useLocale } from '@/contexts/LocaleContext';
import type { ListingWithRelations, SearchFilters } from '@/lib/types';

function FilterPanel({
  categoryId,
  setCategoryId,
  freeOnly,
  setFreeOnly,
  radiusKm,
  setRadiusKm,
  countyId,
  cityId,
  setCountyId,
  setCityId,
  categoryOptions,
  compact,
  t,
}: {
  categoryId?: string;
  setCategoryId: (id?: string) => void;
  freeOnly: boolean;
  setFreeOnly: (v: boolean | ((p: boolean) => boolean)) => void;
  radiusKm: number | null;
  setRadiusKm: (v: number | null) => void;
  countyId: string | null;
  cityId: string | null;
  setCountyId: (v: string | null) => void;
  setCityId: (v: string | null) => void;
  categoryOptions: { id?: string; name: string }[];
  compact?: boolean;
  t: (key: string, options?: Record<string, string | number>) => string;
}) {
  const radiiOpts = radiusOptions();
  return (
    <View style={[styles.filtersInner, compact && styles.filtersCompact]}>
      <Text style={styles.label}>{t('search.category')}</Text>
      <View style={styles.wrapRow}>
        {categoryOptions.map((item) => (
          <Chip
            key={item.id ?? 'all'}
            label={item.name}
            selected={categoryId === item.id}
            onPress={() => setCategoryId(item.id)}
          />
        ))}
      </View>

      <Text style={styles.label}>{t('search.options')}</Text>
      <View style={styles.wrapRow}>
        <Chip
          label={t('search.freeOnly')}
          selected={freeOnly}
          onPress={() => setFreeOnly((v) => !v)}
        />
      </View>

      <Text style={styles.label}>{t('search.radius')}</Text>
      <View style={styles.wrapRow}>
        {radiiOpts.map((opt) => (
          <Chip
            key={String(opt.value)}
            label={opt.label}
            selected={radiusKm === opt.value}
            onPress={() => setRadiusKm(opt.value)}
          />
        ))}
      </View>

      <LocationPicker
        countyId={countyId}
        cityId={cityId}
        onChange={({ countyId: c, cityId: city }) => {
          setCountyId(c);
          setCityId(city);
        }}
      />
    </View>
  );
}

export default function SearchScreen() {
  const { t, locale } = useLocale();
  const { columns, isDesktop, contentPad } = useResponsive();
  const [query, setQuery] = useState('');
  const [countyId, setCountyId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [items, setItems] = useState<ListingWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const filters: SearchFilters = useMemo(() => {
    const city = cityId ? getCity(cityId) : null;
    const countryWide = radiusKm == null && !countyId && !cityId;
    return {
      query: query.trim() || undefined,
      categoryId,
      countyId: countyId || undefined,
      cityId: cityId || undefined,
      freeOnly: freeOnly || undefined,
      radiusKm: countryWide ? null : radiusKm,
      countryWide: countryWide || radiusKm == null,
      centerLat: city?.lat,
      centerLng: city?.lng,
      sort: city ? 'nearest' : 'newest',
      pageSize: 40,
    };
  }, [query, categoryId, countyId, cityId, radiusKm, freeOnly]);

  const activeFilterCount =
    (categoryId ? 1 : 0) +
    (freeOnly ? 1 : 0) +
    (radiusKm != null ? 1 : 0) +
    (countyId ? 1 : 0) +
    (cityId ? 1 : 0);

  const runSearch = async () => {
    setLoading(true);
    try {
      const res = await marketplace.search(filters);
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    marketplace.search(filters).then((res) => {
      if (!active) return;
      setItems(res.items);
      setTotal(res.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [filters]);

  const categoryOptions = [
    { id: undefined as string | undefined, name: t('common.all') },
    ...CATEGORIES.map((c) => ({ id: c.id as string | undefined, name: c.name })),
  ];

  const clearFilters = () => {
    setCategoryId(undefined);
    setFreeOnly(false);
    setRadiusKm(null);
    setCountyId(null);
    setCityId(null);
  };

  const filterSummary = [
    categoryId ? CATEGORIES.find((c) => c.id === categoryId)?.name : null,
    freeOnly ? t('common.free') : null,
    radiusKm != null ? `${radiusKm} km` : null,
    countyId ? getCounty(countyId)?.name : null,
    cityId ? getCity(cityId)?.name : null,
  ].filter(Boolean) as string[];

  const filterProps = {
    categoryId,
    setCategoryId,
    freeOnly,
    setFreeOnly,
    radiusKm,
    setRadiusKm,
    countyId,
    cityId,
    setCountyId,
    setCityId,
    categoryOptions,
    t,
  };

  return (
    <View
      style={[
        styles.root,
        isDesktop && styles.rootDesktop,
        isDesktop && { paddingHorizontal: contentPad, paddingTop: spacing.lg },
      ]}
    >
      {isDesktop ? (
        <View style={styles.desktopSidebar}>
          <Text style={styles.sidebarTitle}>{t('search.filtersTitle')}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <FilterPanel {...filterProps} />
          </ScrollView>
          {activeFilterCount > 0 ? (
            <Button
              label={t('search.resetFilters')}
              variant="ghost"
              compact
              onPress={clearFilters}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.main}>
        <View style={[styles.topBar, !isDesktop && { paddingHorizontal: contentPad }]}>
          <Input
            placeholder={t('search.placeholder')}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            returnKeyType="search"
          />

          {!isDesktop ? (
            <View style={styles.mobileActions}>
              <Pressable
                accessibilityRole="button"
                style={[styles.filterToggle, showFilters && styles.filterToggleOpen]}
                onPress={() => setShowFilters((v) => !v)}
              >
                <Text style={styles.filterToggleText}>
                  {t('common.filters')}
                  {activeFilterCount ? ` · ${activeFilterCount}` : ''}
                </Text>
              </Pressable>
              <Button label={t('common.search')} compact onPress={runSearch} style={{ flex: 1 }} />
            </View>
          ) : (
            <View style={styles.desktopSearchActions}>
              <Button label={t('common.search')} onPress={runSearch} style={{ minWidth: 140 }} />
            </View>
          )}

          {!isDesktop && showFilters ? (
            <View style={styles.mobileFilterCard}>
              <FilterPanel {...filterProps} compact />
              <View style={styles.mobileFilterFooter}>
                <Button
                  label={t('common.reset')}
                  variant="secondary"
                  compact
                  onPress={clearFilters}
                />
                <Button
                  label={t('common.apply')}
                  compact
                  onPress={() => {
                    setShowFilters(false);
                    runSearch();
                  }}
                />
              </View>
            </View>
          ) : null}

          {!isDesktop && !showFilters && filterSummary.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.summaryRow}
            >
              {filterSummary.map((label) => (
                <View key={label} style={styles.summaryChip}>
                  <Text style={styles.summaryChipText}>{label}</Text>
                </View>
              ))}
              <Pressable onPress={clearFilters}>
                <Text style={styles.clearLink}>{t('common.clearAll')}</Text>
              </Pressable>
            </ScrollView>
          ) : null}

          <Text style={styles.count}>
            {loading ? t('search.searching') : t('search.results', { count: total })}
          </Text>
        </View>

        {loading && items.length === 0 ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={items}
            key={`${columns}-${locale}`}
            numColumns={columns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.list,
              !isDesktop && { paddingHorizontal: contentPad },
            ]}
            columnWrapperStyle={columns > 1 ? styles.row : undefined}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
            <EmptyState title={t('search.emptyTitle')} subtitle={t('search.emptySub')} />
            }
            renderItem={({ item }) => (
              <View style={columns > 1 ? styles.cardFlex : null}>
                <ListingCard listing={item} />
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  rootDesktop: {
    flexDirection: 'row',
    gap: spacing.xl,
    maxWidth: layout.contentMax,
    width: '100%',
    alignSelf: 'center',
  },
  desktopSidebar: {
    width: 300,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '100%',
  },
  sidebarTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
  },
  main: { flex: 1, minWidth: 0 },
  topBar: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  mobileActions: { flexDirection: 'row', gap: spacing.sm },
  desktopSearchActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  filterToggle: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleOpen: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  filterToggleText: { fontFamily: fonts.sansBold, color: colors.ink, fontSize: 14 },
  mobileFilterCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
  },
  mobileFilterFooter: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  filtersInner: { gap: spacing.sm },
  filtersCompact: {},
  label: {
    fontFamily: fonts.sansMedium,
    color: colors.inkMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryRow: { gap: spacing.sm, alignItems: 'center', paddingVertical: 2 },
  summaryChip: {
    backgroundColor: colors.brandSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  summaryChipText: { fontFamily: fonts.sansMedium, color: colors.brandDark, fontSize: 12 },
  clearLink: { fontFamily: fonts.sansMedium, color: colors.accent, fontSize: 13 },
  count: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13 },
  list: { paddingBottom: 48, gap: spacing.lg },
  row: { gap: spacing.lg },
  cardFlex: { flex: 1 },
});
