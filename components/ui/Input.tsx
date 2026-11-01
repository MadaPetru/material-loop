import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radii, spacing } from '@/lib/theme';

export function Input({
  label,
  error,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.inkFaint}
        {...props}
        style={[styles.input, error ? styles.inputError : null, props.style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: {
    fontFamily: fonts.sansMedium,
    color: colors.inkMuted,
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 16,
  },
  inputError: { borderColor: colors.danger },
  error: {
    fontFamily: fonts.sans,
    color: colors.danger,
    fontSize: 12,
  },
});
