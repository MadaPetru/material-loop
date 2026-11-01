import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { LocationPicker } from '@/components/LocationPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CATEGORIES, subcategoriesFor } from '@/data/categories';
import { getCity } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { marketplace } from '@/lib/api/marketplace';
import { MAX_PHOTOS } from '@/lib/config';
import { conditionLabels, unitLabels } from '@/lib/labels';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import type { MeasurementUnit, ProductCondition } from '@/lib/types';

const CONDITIONS = Object.keys(conditionLabels) as ProductCondition[];
const UNITS = Object.keys(unitLabels) as MeasurementUnit[];

export default function CreateListingScreen() {
  const { user } = useAuth();
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
  const [countyId, setCountyId] = useState<string | null>('bh');
  const [cityId, setCityId] = useState<string | null>('bh-oradea');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const subs = useMemo(() => subcategoriesFor(categoryId), [categoryId]);
  const needsStorage =
    condition !== 'new_unopened' &&
    (categoryId === 'cat-cement' || categoryId === 'cat-paint');

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Autentifică-te pentru a publica.</Text>
        <Button label="Autentificare" onPress={() => router.push('/(auth)/login')} />
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

  const submit = async (status: 'draft' | 'active') => {
    if (!title.trim() || !description.trim() || !cityId) {
      Alert.alert('Completare incompletă', 'Titlu, descriere și localitate sunt obligatorii.');
      return;
    }
    if (needsStorage && !storageNotes.trim()) {
      Alert.alert(
        'Note de depozitare',
        'Pentru materiale chimice / vopsele deschise sau parțial folosite, adaugă note de depozitare.'
      );
      return;
    }
    const city = getCity(cityId);
    if (!city) {
      Alert.alert('Localitate invalidă');
      return;
    }
    setBusy(true);
    try {
      const listing = await marketplace.createListing(user.id, {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        subcategoryId,
        brand: brand.trim() || null,
        model: model.trim() || null,
        condition,
        quantity: Number(quantity.replace(',', '.')) || 1,
        unit,
        originalPackageQuantity: null,
        price: isFree ? 0 : Number(price.replace(',', '.')) || 0,
        currency: 'RON',
        isNegotiable: isFree ? false : isNegotiable,
        isFree,
        cityId,
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
      Alert.alert('Eroare', e instanceof Error ? e.message : 'Nu am putut salva anunțul');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 60 }}>
      <Text style={styles.brand}>MaterialLoop</Text>
      <Text style={styles.title}>Detalii material</Text>

      <Input label="Titlu" value={title} onChangeText={setTitle} placeholder="ex. Adeziv Ceresit 3 saci" />
      <Input
        label="Descriere"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ minHeight: 100, textAlignVertical: 'top' }}
      />

      <Text style={styles.label}>Categorie</Text>
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

      <Text style={styles.label}>Subcategorie</Text>
      <View style={styles.wrapRow}>
        {subs.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setSubcategoryId(s.id)}
            style={[styles.chip, subcategoryId === s.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, subcategoryId === s.id && styles.chipTextActive]}>{s.name}</Text>
          </Pressable>
        ))}
      </View>

      <Input label="Brand (opțional)" value={brand} onChangeText={setBrand} />
      <Input label="Model / referință (opțional)" value={model} onChangeText={setModel} />

      <Text style={styles.label}>Stare</Text>
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
          <Input label="Cantitate" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
        </View>
      </View>
      <Text style={styles.label}>Unitate</Text>
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
        <Text style={styles.switchLabel}>Material gratuit</Text>
        <Switch value={isFree} onValueChange={setIsFree} />
      </View>
      {!isFree ? (
        <>
          <Input label="Preț (RON)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Preț negociabil</Text>
            <Switch value={isNegotiable} onValueChange={setIsNegotiable} />
          </View>
        </>
      ) : null}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Ridicare</Text>
        <Switch value={pickup} onValueChange={setPickup} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Livrare posibilă</Text>
        <Switch value={delivery} onValueChange={setDelivery} />
      </View>

      {(needsStorage || storageNotes) && (
        <Input
          label="Note depozitare / siguranță"
          value={storageNotes}
          onChangeText={setStorageNotes}
          multiline
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      )}

      <Text style={styles.label}>Locație (aproximativă)</Text>
      <LocationPicker
        countyId={countyId}
        cityId={cityId}
        onChange={({ countyId: c, cityId: city }) => {
          setCountyId(c);
          setCityId(city);
        }}
      />

      <Text style={styles.label}>Fotografii ({photos.length}/{MAX_PHOTOS})</Text>
      <View style={styles.photos}>
        {photos.map((uri) => (
          <Image key={uri} source={{ uri }} style={styles.thumb} />
        ))}
      </View>
      <Button label="Adaugă fotografii" variant="secondary" onPress={pickPhotos} />

      <Button
        label={busy ? 'Se publică…' : 'Publică anunț'}
        onPress={() => submit('active')}
        disabled={busy}
      />
      <Button
        label="Salvează ciornă"
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
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, marginBottom: spacing.sm },
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
