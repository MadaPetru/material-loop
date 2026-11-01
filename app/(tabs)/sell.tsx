import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, spacing } from '@/lib/theme';

export default function SellTab() {
  const { user } = useAuth();

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>MaterialLoop</Text>
      <Text style={styles.title}>Publică un material rămas</Text>
      <Text style={styles.sub}>
        În câteva minute poți lista adeziv, plăci, izolație sau unelte — cu preț sau gratuit, oriunde
        în România.
      </Text>
      <Button
        label={user ? 'Creează anunț' : 'Autentifică-te pentru a vinde'}
        onPress={() => router.push(user ? '/listing/create' : '/(auth)/login')}
      />
      <Button
        label="Vezi anunțurile mele"
        variant="secondary"
        onPress={() => router.push('/(tabs)/profile')}
        style={{ marginTop: spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
  },
  brand: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.brand },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, lineHeight: 36 },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.inkMuted,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
});
