import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { LocationPicker } from '@/components/LocationPicker';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Input } from '@/components/ui/Input';
import { CATEGORIES, subcategoriesFor } from '@/data/categories';
import { formatCityCounty, getCity, nearestCity } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { marketplace } from '@/lib/api/marketplace';
import { MAX_PHOTOS } from '@/lib/config';
import { conditionLabels, unitLabels } from '@/lib/labels';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { toUserError } from '@/lib/userErrors';
import type { MeasurementUnit, ProductCondition } from '@/lib/types';

const CONDITIONS = Object.keys(conditionLabels) as ProductCondition[];
const UNITS = Object.keys(unitLabels) as MeasurementUnit[];

export default function CreateListingScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(
    subcategoriesFor(CATEGORIES[0].id)[0]?.id ?? null
  );
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('new_unopened');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<MeasurementUnit>('piece');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [pickup, setPickup] = useState(true);
  const [delivery, setDelivery] = useState(false);
  const [storageNotes, setStorageNotes] = useState('');
  const [countyId, setCountyId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const subs = useMemo(() => subcategoriesFor(categoryId), [categoryId]);

  const applyCity = useCallback((nextCityId: string, note?: string) => {
    const city = getCity(nextCityId);
    if (!city) return;
    setCityId(city.id);
    setCountyId(city.countyId);
    if (note) setLocationNote(note);
  }, []);

  const detectLocation = useCallback(async () => {
    setDetectingLocation(true);
    setLocationNote(t('createListing.locationDetecting'));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationNote(null);
        return false;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const city = nearestCity(pos.coords.latitude, pos.coords.longitude);
      if (!city) {
        setLocationNote(null);
        return false;
      }
      applyCity(
        city.id,
        t('createListing.locationDetected', { place: formatCityCounty(city.id) })
      );
      return true;
    } catch {
      setLocationNote(null);
      return false;
    } finally {
      setDetectingLocation(false);
    }
  }, [applyCity, t]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      if (user.cityId && getCity(user.cityId)) {
        if (!cancelled) applyCity(user.cityId);
        return;
      }
      if (!cancelled) await detectLocation();
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally once per signed-in user / profile city.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.cityId]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>{t('createListing.loginToPublish')}</Text>
        <Button label={t('createListing.login')} onPress={() => router.push('/(auth)/login')} />
      </View>
    );
  }

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
    }
  };

  const missingFields = (forPublish: boolean) => {
    const missing: string[] = [];
    if (!title.trim()) missing.push(t('createListing.fieldTitle'));
    if (forPublish && !cityId) missing.push(t('createListing.fieldLocation'));
    return missing;
  };

  const submit = async (status: 'draft' | 'active') => {
    const forPublish = status === 'active';
    const missing = missingFields(forPublish);
    if (missing.length) {
      setError(t('createListing.missingFields', { fields: missing.join(', ') }));
      return;
    }

    // Drafts can skip location; use a safe fallback only if city somehow missing after checks.
    let resolvedCityId = cityId;
    if (!resolvedCityId && user.cityId && getCity(user.cityId)) {
      resolvedCityId = user.cityId;
    }
    if (!resolvedCityId && forPublish) {
      setError(t('createListing.missingFields', { fields: t('createListing.fieldLocation') }));
      return;
    }
    if (!resolvedCityId) {
      // Last-resort draft fallback so DB NOT NULL city_id is satisfied.
      resolvedCityId = 'bh-oradea';
    }

    const city = getCity(resolvedCityId);
    if (!city) {
      setError(t('createListing.missingFields', { fields: t('createListing.fieldLocation') }));
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim() || trimmedTitle;
    const parsedPrice = Number(price.replace(',', '.'));
    const free = isFree || !price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0;

    setBusy(true);
    setError(null);
    try {
      const listing = await marketplace.createListing(user.id, {
        title: trimmedTitle,
        description: trimmedDescription,
        categoryId,
        subcategoryId,
        brand: brand.trim() || null,
        model: model.trim() || null,
        condition,
        quantity: Number(quantity.replace(',', '.')) || 1,
        unit,
        originalPackageQuantity: null,
        price: free ? 0 : parsedPrice,
        currency: 'RON',
        isNegotiable: free ? false : isNegotiable,
        isFree: free,
        cityId: city.id,
        countryId: 'ro',
        lat: city.lat,
        lng: city.lng,
        pickupAvailable: pickup,
        deliveryAvailable: delivery,
        storageNotes: storageNotes.trim() || null,
        status,
        photoUrls: photos,
      });
      router.replace(`/listing/${listing.id}`);
    } catch (e) {
      setError(toUserError(e, t('errors.genericRetry')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>{t('common.brand')}</Text>
      <Text style={styles.title}>{t('createListing.heading')}</Text>
      <Text style={styles.hint}>{t('createListing.hint')}</Text>
      <ErrorBanner message={error} />

      <Input
        label={t('createListing.titleRequired')}
        value={title}
        onChangeText={(v) => {
          setTitle(v);
          setError(null);
        }}
        placeholder="ex. Adeziv Ceresit 3 saci"
      />
      <Input
        label={t('createListing.descriptionOptional')}
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ minHeight: 100, textAlignVertical: 'top' }}
      />

      <Text style={styles.label}>{t('createListing.category')}</Text>
      <View style={styles.wrapRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              setCategoryId(c.id);
              setSubcategoryId(subcategoriesFor(c.id)[0]?.id ?? null);
            }}
            style={[styles.chip, categoryId === c.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </View>

      {subs.length ? (
        <>
          <Text style={styles.label}>{t('createListing.subcategory')}</Text>
          <View style={styles.wrapRow}>
            {subs.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSubcategoryId(s.id)}
                style={[styles.chip, subcategoryId === s.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, subcategoryId === s.id && styles.chipTextActive]}>
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Input label={t('createListing.brand')} value={brand} onChangeText={setBrand} />
      <Input label={t('createListing.model')} value={model} onChangeText={setModel} />

      <Text style={styles.label}>{t('createListing.condition')}</Text>
      <View style={styles.wrapRow}>
        {CONDITIONS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCondition(c)}
            style={[styles.chip, condition === c && styles.chipActive]}
          >
            <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>
              {conditionLabels[c]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Input
            label={t('createListing.quantity')}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <Text style={styles.label}>{t('createListing.unit')}</Text>
      <View style={styles.wrapRow}>
        {UNITS.map((u) => (
          <Pressable
            key={u}
            onPress={() => setUnit(u)}
            style={[styles.chip, unit === u && styles.chipActive]}
          >
            <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{unitLabels[u]}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('createListing.free')}</Text>
        <Switch
          value={isFree}
          onValueChange={(v) => {
            setIsFree(v);
            if (v) setPrice('');
          }}
        />
      </View>
      {!isFree ? (
        <>
          <Input
            label={t('createListing.price')}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('createListing.negotiable')}</Text>
            <Switch value={isNegotiable} onValueChange={setIsNegotiable} />
          </View>
        </>
      ) : null}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('createListing.pickup')}</Text>
        <Switch value={pickup} onValueChange={setPickup} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('createListing.delivery')}</Text>
        <Switch value={delivery} onValueChange={setDelivery} />
      </View>

      <Input
        label={t('createListing.storage')}
        value={storageNotes}
        onChangeText={setStorageNotes}
        multiline
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <Text style={styles.label}>{t('createListing.location')}</Text>
      <Text style={styles.hint}>{t('createListing.locationHint')}</Text>
      {locationNote ? <Text style={styles.locationNote}>{locationNote}</Text> : null}
      <Button
        label={detectingLocation ? t('createListing.locationDetecting') : t('createListing.useMyLocation')}
        variant="secondary"
        onPress={() => detectLocation()}
        disabled={detectingLocation || busy}
      />
      <LocationPicker
        countyId={countyId}
        cityId={cityId}
        onChange={({ countyId: c, cityId: city }) => {
          setCountyId(c);
          setCityId(city);
          setLocationNote(null);
          setError(null);
        }}
      />

      <Text style={styles.label}>
        {t('createListing.photos', { count: photos.length, max: MAX_PHOTOS })}
      </Text>
      <View style={styles.photos}>
        {photos.map((uri) => (
          <Image key={uri} source={{ uri }} style={styles.thumb} />
        ))}
      </View>
      <Button label={t('createListing.addPhotos')} variant="secondary" onPress={pickPhotos} />

      <Button
        label={busy ? t('createListing.publishing') : t('createListing.publish')}
        onPress={() => submit('active')}
        disabled={busy}
      />
      <Button
        label={busy ? t('createListing.saving') : t('createListing.saveDraft')}
        variant="ghost"
        onPress={() => submit('draft')}
        disabled={busy}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  msg: { fontFamily: fonts.sans, color: colors.inkMuted, textAlign: 'center' },
  brand: { fontFamily: fonts.displayBold, color: colors.brand, fontSize: 22 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  hint: {
    fontFamily: fonts.sans,
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  locationNote: {
    fontFamily: fonts.sansMedium,
    color: colors.brandDark,
    fontSize: 13,
    lineHeight: 18,
  },
  label: { fontFamily: fonts.sansMedium, color: colors.inkMuted, fontSize: 13 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
  },
  chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 13 },
  chipTextActive: { color: colors.brandDark },
  row2: { flexDirection: 'row', gap: spacing.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  switchLabel: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 15 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: { width: 88, height: 88, borderRadius: radii.sm, backgroundColor: colors.mapDust },
});
