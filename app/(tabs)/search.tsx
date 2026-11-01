import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { getCity } from '@/data/romania';
import { marketplace } from '@/lib/api/marketplace';
import { radiusOptions } from '@/lib/labels';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import type { ListingWithRelations, SearchFilters } from '@/lib/types';

export default function SearchScreen() {
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
      <View
        style={[
          styles.top,
          isDesktop && styles.topDesktop,
          { paddingHorizontal: contentPad },
        ]}
      >
        <Input
          placeholder="Caută materiale, brand, descriere..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        <View style={styles.actions}>
          <Button
            label={showFilters ? 'Ascunde filtre' : 'Filtre'}
            variant="secondary"
            compact
            onPress={() => setShowFilters((v) => !v)}
            style={{ flex: 1 }}
          />
          <Button label="Caută" compact onPress={runSearch} style={{ flex: 1 }} />
        </View>

        {showFilters ? (
          <View style={[styles.filters, isDesktop && styles.filtersDesktop]}>
            <Text style={styles.label}>Categorie</Text>
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

            <Chip
              label="Doar gratuite"
              selected={freeOnly}
              onPress={() => setFreeOnly((v) => !v)}
              style={{ alignSelf: 'flex-start' }}
            />

            <Text style={styles.label}>Rază</Text>
            <View style={styles.wrapRow}>
              {radiusOptions.map((opt) => (
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
        ) : null}

        <Text style={styles.count}>{loading ? 'Se caută…' : `${total} anunțuri găsite`}</Text>
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          key={columns}
          numColumns={columns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: contentPad },
            isDesktop && { maxWidth: layout.contentMax, alignSelf: 'center', width: '100%' },
          ]}
          columnWrapperStyle={columns > 1 ? styles.row : undefined}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              title="Niciun rezultat"
              subtitle="Încearcă altă localitate, o rază mai mare sau „Toată țara”."
            />
          }
          renderItem={({ item }) => (
            <View style={[columns > 1 ? styles.cardFlex : null]}>
              <ListingCard listing={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.bgElevated,
  },
  topDesktop: {
    maxWidth: layout.contentMax,
    width: '100%',
    alignSelf: 'center',
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    marginTop: spacing.md,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  filters: { gap: spacing.sm, paddingBottom: spacing.sm },
  filtersDesktop: { maxHeight: 280 },
  label: {
    fontFamily: fonts.sansMedium,
    color: colors.inkMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  count: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13 },
  list: { paddingVertical: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  row: { gap: spacing.lg },
  cardFlex: { flex: 1 },
});
