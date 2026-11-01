import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';

export default function SellTab() {
  const { user } = useAuth();
  const { isDesktop } = useResponsive();

  return (
    <Screen>
      <View style={[styles.panel, isDesktop && styles.panelDesktop]}>
        <Text style={styles.eyebrow}>Vânzare rapidă</Text>
        <Text style={styles.brand}>MaterialLoop</Text>
        <Text style={styles.title}>Publică un material rămas</Text>
        <Text style={styles.sub}>
          În câteva minute poți lista adeziv, plăci, izolație sau unelte — cu preț sau gratuit,
          oriunde în România.
        </Text>
        <Button
          label={user ? 'Creează anunț' : 'Autentifică-te pentru a vinde'}
          onPress={() => router.push(user ? '/listing/create' : '/(auth)/login')}
        />
        <Button
          label="Vezi anunțurile mele"
          variant="secondary"
          onPress={() => router.push('/(tabs)/profile')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
  },
  panelDesktop: {
    marginTop: spacing.xxl,
    padding: spacing.xxl,
  },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  brand: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.brand },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, lineHeight: 36 },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.inkMuted,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
});
