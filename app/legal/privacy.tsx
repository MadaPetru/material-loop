import { LegalDoc } from '@/components/legal/LegalDoc';
import { useLocale } from '@/contexts/LocaleContext';

export default function PrivacyScreen() {
  const { locale } = useLocale();
  return <LegalDoc id="privacy" locale={locale} />;
}
