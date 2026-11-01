import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LocationPicker } from '@/components/LocationPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getCity } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, spacing } from '@/lib/theme';

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [countyId, setCountyId] = useState<string | null>(
    user?.cityId ? user.cityId.split('-')[0] : 'bh'
  );
  const [cityId, setCityId] = useState<string | null>(user?.cityId ?? 'bh-oradea');
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <View style={styles.root}>
        <Text style={styles.msg}>Nu ești autentificat.</Text>
      </View>
    );
  }

  const save = async () => {
    const city = cityId ? getCity(cityId) : null;
    setBusy(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || user.displayName,
        bio: bio.trim() || null,
        cityId,
        lat: city?.lat ?? user.lat,
        lng: city?.lng ?? user.lng,
      });
      router.back();
    } catch (e) {
      Alert.alert('Eroare', e instanceof Error ? e.message : 'Salvare eșuată');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
      <Text style={styles.title}>Profilul tău</Text>
      <Input label="Nume afișat" value={displayName} onChangeText={setDisplayName} />
      <Input
        label="Despre tine"
        value={bio}
        onChangeText={setBio}
        multiline
        style={{ minHeight: 90, textAlignVertical: 'top' }}
      />
      <Text style={styles.label}>Locație (fără adresă exactă publică)</Text>
      <LocationPicker
        countyId={countyId}
        cityId={cityId}
        onChange={({ countyId: c, cityId: city }) => {
          setCountyId(c);
          setCityId(city);
        }}
      />
      <Button label={busy ? 'Se salvează…' : 'Salvează'} onPress={save} disabled={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  label: { fontFamily: fonts.sansMedium, color: colors.inkMuted, fontSize: 13 },
  msg: { fontFamily: fonts.sans, color: colors.inkMuted, padding: spacing.xl },
});
