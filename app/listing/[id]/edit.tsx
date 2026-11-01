import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, spacing } from '@/lib/theme';
import type { ListingWithRelations } from '@/lib/types';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingWithRelations | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    marketplace.getListing(String(id)).then((item) => {
      setListing(item);
      if (item) {
        setTitle(item.title);
        setDescription(item.description);
        setPrice(String(item.price));
      }
    });
  }, [id]);

  if (!listing || !user) {
    return <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />;
  }

  if (listing.sellerId !== user.id) {
    return (
      <View style={styles.root}>
        <Text style={styles.msg}>Nu poți edita acest anunț.</Text>
      </View>
    );
  }

  const save = async () => {
    setBusy(true);
    try {
      await marketplace.updateListing(listing.id, user.id, {
        title: title.trim(),
        description: description.trim(),
        price: listing.isFree ? 0 : Number(price.replace(',', '.')) || 0,
        photoUrls: listing.photos.map((p) => p.url),
      });
      router.replace(`/listing/${listing.id}`);
    } catch (e) {
      Alert.alert('Eroare', e instanceof Error ? e.message : 'Salvare eșuată');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Editează anunț</Text>
      <Input label="Titlu" value={title} onChangeText={setTitle} />
      <Input
        label="Descriere"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ minHeight: 120, textAlignVertical: 'top' }}
      />
      {!listing.isFree ? (
        <Input label="Preț (RON)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      ) : null}
      <Button label={busy ? 'Se salvează…' : 'Salvează'} onPress={save} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  msg: { fontFamily: fonts.sans, color: colors.inkMuted },
});
