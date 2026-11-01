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
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { CATEGORIES } from '@/data/categories';
import { getCity } from '@/data/romania';
import { marketplace } from '@/lib/api/marketplace';
import { radiusOptions } from '@/lib/labels';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { ListingWithRelations, SearchFilters } from '@/lib/types';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [countyId, setCountyId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [items, setItems] = useState<ListingWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

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
    { id: undefined as string | undefined, name: 'Toate' },
    ...CATEGORIES.map((c) => ({ id: c.id as string | undefined, name: c.name })),
  ];

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Input
          placeholder="Caută materiale, brand, descriere..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={styles.filterBtn}
            onPress={() => setShowFilters((v) => !v)}
          >
            <Text style={styles.filterBtnText}>{showFilters ? 'Ascunde filtre' : 'Filtre'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.searchBtn} onPress={runSearch}>
            <Text style={styles.searchBtnText}>Caută</Text>
          </Pressable>
        </View>

        {showFilters ? (
          <ScrollView
            style={styles.filtersScroll}
            contentContainerStyle={styles.filters}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Categorie</Text>
            <View style={styles.wrapRow}>
              {categoryOptions.map((item) => (
                <Pressable
                  key={item.id ?? 'all'}
                  onPress={() => setCategoryId(item.id)}
                  style={[styles.chip, categoryId === item.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, categoryId === item.id && styles.chipTextActive]}>
                    {item.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setFreeOnly((v) => !v)}
              style={[styles.chip, freeOnly && styles.chipActive, { alignSelf: 'flex-start' }]}
            >
              <Text style={[styles.chipText, freeOnly && styles.chipTextActive]}>Doar gratuite</Text>
            </Pressable>

            <Text style={styles.label}>Rază</Text>
            <View style={styles.wrapRow}>
              {radiusOptions.map((opt) => (
                <Pressable
                  key={String(opt.value)}
                  onPress={() => setRadiusKm(opt.value)}
                  style={[styles.chip, radiusKm === opt.value && styles.chipActive]}
                >
                  <Text style={[styles.chipText, radiusKm === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
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
          </ScrollView>
        ) : null}

        <Text style={styles.count}>{loading ? 'Se caută…' : `${total} anunțuri`}</Text>
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              title="Niciun rezultat"
              subtitle="Încearcă altă localitate, rază mai mare sau „Toată țara”."
            />
          }
          renderItem={({ item }) => <ListingCard listing={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: {
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.bgElevated,
    maxHeight: '55%',
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  filterBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnText: { fontFamily: fonts.sansMedium, color: colors.ink },
  searchBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { fontFamily: fonts.sansBold, color: colors.white },
  filtersScroll: { flexGrow: 0 },
  filters: { gap: spacing.sm, paddingBottom: spacing.sm },
  label: { fontFamily: fonts.sansMedium, color: colors.inkMuted, fontSize: 13, marginTop: spacing.xs },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
  },
  chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 13 },
  chipTextActive: { color: colors.brandDark },
  count: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13 },
});
