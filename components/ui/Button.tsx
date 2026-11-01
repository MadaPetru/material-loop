import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, fonts, radii, spacing } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  compact,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  compact?: boolean;
}) {
  const darkLabel = variant === 'secondary' || variant === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      role="button"
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, darkLabel && styles.labelDark]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.brand },
  accent: { backgroundColor: colors.accent },
  secondary: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  label: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
  },
  labelDark: { color: colors.ink },
});
