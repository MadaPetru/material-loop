import { Pressable, Text } from 'react-native';
import { LegalDoc } from '@/components/legal/LegalDoc';
import { useConsent } from '@/contexts/ConsentContext';
import { useLocale } from '@/contexts/LocaleContext';
import { pageMeta } from '@/lib/seo';
import { colors, fonts, spacing } from '@/lib/theme';

export function generateMetadata() {
  return pageMeta({
    title: 'Politica de cookie-uri',
    description:
      'Cum folosește MaterialLoop cookie-urile și cum îți poți gestiona preferințele de consimțământ.',
    path: '/legal/cookies',
  });
}

export default function CookiesScreen() {
  const { locale, t } = useLocale();
  const { openPreferences } = useConsent();
  return (
    <LegalDoc
      id="cookies"
      locale={locale}
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={openPreferences}
          style={{ marginTop: spacing.lg }}
        >
          <Text style={{ fontFamily: fonts.sansBold, color: colors.brand, fontSize: 15 }}>
            {t('legal.managePreferences')}
          </Text>
        </Pressable>
      }
    />
  );
}
