import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useLocale } from '@/contexts/LocaleContext';
import { colors, fonts, spacing } from '@/lib/theme';

/** “By continuing…” notice under login / register actions. */
export function AuthLegalNotice() {
  const { t } = useLocale();
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        {t('auth.legalNoticeBefore')}{' '}
        <Link href="/legal/terms" asChild>
          <Text style={styles.link}>{t('legal.terms')}</Text>
        </Link>
        {' · '}
        <Link href="/legal/privacy" asChild>
          <Text style={styles.link}>{t('legal.privacy')}</Text>
        </Link>
        {t('auth.legalNoticeAfter')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  text: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkFaint,
    textAlign: 'center',
  },
  link: {
    fontFamily: fonts.sansMedium,
    color: colors.brand,
    fontSize: 12,
  },
});
