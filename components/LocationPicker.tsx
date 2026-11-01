import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COUNTIES, citiesForCounty } from '@/data/romania';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { Input } from './ui/Input';

export function LocationPicker({
  countyId,
  cityId,
  onChange,
}: {
  countyId?: string | null;
  cityId?: string | null;
  onChange: (next: { countyId: string | null; cityId: string | null }) => void;
}) {
  const [countyQuery, setCountyQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');

  const counties = useMemo(() => {
    const q = countyQuery.trim().toLowerCase();
    return COUNTIES.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [countyQuery]);

  const cities = useMemo(() => {
    if (!countyId) return [];
    const q = cityQuery.trim().toLowerCase();
    return citiesForCounty(countyId).filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [countyId, cityQuery]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Județ</Text>
      <Input
        placeholder="Caută județ..."
        value={countyQuery}
        onChangeText={setCountyQuery}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {counties.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              onChange({ countyId: c.id, cityId: null });
              setCountyQuery('');
            }}
            style={[styles.chip, countyId === c.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, countyId === c.id && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {countyId ? (
        <>
          <Text style={styles.heading}>Localitate</Text>
          <Input placeholder="Caută localitate..." value={cityQuery} onChangeText={setCityQuery} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {cities.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  onChange({ countyId, cityId: c.id });
                  setCityQuery('');
                }}
                style={[styles.chip, cityId === c.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, cityId === c.id && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  heading: {
    fontFamily: fonts.sansMedium,
    color: colors.inkMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
  },
  chipActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  chipText: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 14 },
  chipTextActive: { color: colors.brandDark },
});
