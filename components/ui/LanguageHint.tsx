import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/lib/theme';

/** Visible language control placeholder — RO is live; EN i18n can plug in later. */
export function LanguageHint() {
  return (
    <View style={styles.wrap} accessibilityLabel="Limbă: Română">
      <Text style={[styles.chip, styles.active]}>RO</Text>
      <Text style={styles.chip}>EN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.bgMuted,
    borderRadius: radii.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chip: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.inkFaint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  active: {
    backgroundColor: colors.bgElevated,
    color: colors.ink,
    fontFamily: fonts.sansBold,
  },
});
