import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { router } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/lib/theme';

export default function MessagesScreen() {
  return (
    <Screen>
      <View style={styles.panel}>
        <Text style={styles.badge}>În curând</Text>
        <Text style={styles.title}>Mesaje</Text>
        <Text style={styles.sub}>
          Chat-ul între cumpărători și vânzători vine în următoarea etapă. Între timp, salvează
          anunțuri la Favorite și urmărește vânzătorii din pagina de detaliu.
        </Text>
        <Button label="Vezi favoritele" variant="secondary" onPress={() => router.push('/favorites')} />
        <Button label="Caută materiale" onPress={() => router.push('/search')} />
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
  badge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.brandDark,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.sans, fontSize: 16, color: colors.inkMuted, lineHeight: 24 },
});
