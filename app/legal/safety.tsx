import { LegalDoc } from '@/components/legal/LegalDoc';
import { useLocale } from '@/contexts/LocaleContext';

export default function SafetyScreen() {
  const { locale } = useLocale();
  return <LegalDoc id="safety" locale={locale} />;
}