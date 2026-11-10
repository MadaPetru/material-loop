import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocale } from '@/contexts/LocaleContext';
import { COUNTIES, citiesForCounty } from '@/data/romania';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { Input } from './ui/Input';

const SCROLL_STEP = 220;

function ChipCarousel({
  items,
  selectedId,
  onSelect,
  emptyLabel,
  prevLabel,
  nextLabel,
}: {
  items: { id: string; name: string }[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  emptyLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const canScroll = contentWidth > viewportWidth + 8;
  const atStart = offsetX <= 4;
  const atEnd = offsetX + viewportWidth >= contentWidth - 4;

  useEffect(() => {
    // Reset position when the filtered list changes (e.g. search).
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    setOffsetX(0);
  }, [items]);

  useEffect(() => {
    if (!selectedId) return;
    const index = items.findIndex((item) => item.id === selectedId);
    if (index < 0) return;
    // Approximate chip width so the selected item stays in view.
    scrollRef.current?.scrollTo({ x: Math.max(0, index * 96 - 24), animated: true });
  }, [selectedId, items]);

  const scrollBy = (delta: number) => {
    const next = Math.max(0, Math.min(offsetX + delta, Math.max(0, contentWidth - viewportWidth)));
    scrollRef.current?.scrollTo({ x: next, animated: true });
    setOffsetX(next);
  };

  if (!items.length) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.carousel}>
      {canScroll ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={prevLabel}
          disabled={atStart}
          onPress={() => scrollBy(-SCROLL_STEP)}
          style={[styles.arrow, atStart && styles.arrowDisabled]}
        >
          <FontAwesome name="chevron-left" size={14} color={atStart ? colors.inkFaint : colors.ink} />
        </Pressable>
      ) : null}

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        style={styles.carouselTrack}
        contentContainerStyle={styles.row}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          setOffsetX(e.nativeEvent.contentOffset.x);
        }}
        scrollEventThrottle={16}
        onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentWidth(w)}
      >
        {items.map((item) => {
          const selected = selectedId === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(item.id)}
              style={[styles.chip, selected && styles.chipActive]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {canScroll ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
          disabled={atEnd}
          onPress={() => scrollBy(SCROLL_STEP)}
          style={[styles.arrow, atEnd && styles.arrowDisabled]}
        >
          <FontAwesome name="chevron-right" size={14} color={atEnd ? colors.inkFaint : colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function LocationPicker({
  countyId,
  cityId,
  onChange,
}: {
  countyId?: string | null;
  cityId?: string | null;
  onChange: (next: { countyId: string | null; cityId: string | null }) => void;
}) {
  const { t } = useLocale();
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
      <Text style={styles.heading}>{t('locationPicker.county')}</Text>
      <Input
        placeholder={t('locationPicker.countySearch')}
        value={countyQuery}
        onChangeText={setCountyQuery}
      />
      <ChipCarousel
        items={counties}
        selectedId={countyId}
        emptyLabel={t('locationPicker.noCounties')}
        prevLabel={t('locationPicker.prev')}
        nextLabel={t('locationPicker.next')}
        onSelect={(id) => {
          onChange({ countyId: id, cityId: null });
          setCountyQuery('');
          setCityQuery('');
        }}
      />

      {countyId ? (
        <>
          <Text style={styles.heading}>{t('locationPicker.locality')}</Text>
          <Input
            placeholder={t('locationPicker.localitySearch')}
            value={cityQuery}
            onChangeText={setCityQuery}
          />
          <ChipCarousel
            items={cities}
            selectedId={cityId}
            emptyLabel={t('locationPicker.noLocalities')}
            prevLabel={t('locationPicker.prev')}
            nextLabel={t('locationPicker.next')}
            onSelect={(id) => {
              onChange({ countyId, cityId: id });
              setCityQuery('');
            }}
          />
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
  carousel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  carouselTrack: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    alignItems: 'center',
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.45,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    maxWidth: 180,
  },
  chipActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  chipText: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 14 },
  chipTextActive: { color: colors.brandDark },
  empty: {
    fontFamily: fonts.sans,
    color: colors.inkFaint,
    fontSize: 13,
    paddingVertical: spacing.xs,
  },
});
