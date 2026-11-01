import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, fonts, radii, spacing } from '@/lib/theme';

export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  selected: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  pressed: { opacity: 0.88 },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  labelSelected: {
    color: colors.brandDark,
    fontFamily: fonts.sansBold,
  },
});
