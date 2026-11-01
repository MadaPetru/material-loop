import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/lib/theme';

export function ErrorBanner({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={styles.wrap}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#E5C2BC',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  text: {
    fontFamily: fonts.sansMedium,
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
