import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, fonts, radii, spacing } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      role="button"
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, variant === 'secondary' || variant === 'ghost' ? styles.labelDark : null]}>
        {label}
      </Text>
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
  primary: { backgroundColor: colors.brand },
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
    fontSize: 16,
  },
  labelDark: { color: colors.ink },
});
