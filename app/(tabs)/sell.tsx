import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';

export default function SellTab() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { isDesktop } = useResponsive();

  return (
    <Screen>
      <View style={[styles.panel, isDesktop && styles.panelDesktop]}>
        <Text style={styles.eyebrow}>{t('sell.eyebrow')}</Text>
        <Text style={styles.brand}>{t('common.brand')}</Text>
        <Text style={styles.title}>{t('sell.title')}</Text>
        <Text style={styles.sub}>{t('sell.sub')}</Text>
        <Button
          label={user ? t('sell.create') : t('sell.loginToSell')}
          onPress={() => router.push(user ? '/listing/create' : '/(auth)/login')}
        />
        <Button
          label={t('sell.myListings')}
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
