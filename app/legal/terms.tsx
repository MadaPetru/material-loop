import { Link } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { LegalDoc } from '@/components/legal/LegalDoc';
import { useLocale } from '@/contexts/LocaleContext';
import { colors, fonts, spacing } from '@/lib/theme';

export default function TermsScreen() {
  const { locale, t } = useLocale();
  return (
    <LegalDoc
      id="terms"
      locale={locale}
      footer={
        <Link href="/legal/safety" asChild>
          <Pressable style={{ marginTop: spacing.lg }}>
            <Text style={{ fontFamily: fonts.sansBold, color: colors.brand, fontSize: 15 }}>
              {t('legal.safetyLink')}
            </Text>
          </Pressable>
        </Link>
      }
    />
  );
}
