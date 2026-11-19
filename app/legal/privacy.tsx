import { LegalDoc } from '@/components/legal/LegalDoc';
import { useLocale } from '@/contexts/LocaleContext';
import { pageMeta } from '@/lib/seo';

export function generateMetadata() {
  return pageMeta({
    title: 'Politica de confidențialitate',
    description:
      'Politica de confidențialitate MaterialLoop — cum colectăm, folosim și protejăm datele personale pe marketplace-ul de materiale rămase.',
    path: '/legal/privacy',
  });
}

export default function PrivacyScreen() {
  const { locale } = useLocale();
  return <LegalDoc id="privacy" locale={locale} />;
}
