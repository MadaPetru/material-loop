import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '@/contexts/LocaleContext';
import type { AppLocale } from '@/lib/i18n';
import { colors, fonts, radii, spacing } from '@/lib/theme';

const OPTIONS: AppLocale[] = ['ro', 'en'];

export function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();

  return (
    <View
      style={styles.wrap}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('language.label')}
    >
      {OPTIONS.map((code) => {
        const active = locale === code;
        return (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(`language.${code}`)}
            onPress={() => setLocale(code)}
            style={[styles.chip, active && styles.active]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{code.toUpperCase()}</Text>
          </Pressable>
        );
      })}
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  active: {
    backgroundColor: colors.bgElevated,
  },
  text: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.inkFaint,
  },
  textActive: {
    color: colors.ink,
    fontFamily: fonts.sansBold,
  },
});
