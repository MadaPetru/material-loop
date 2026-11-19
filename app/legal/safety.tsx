import { LegalDoc } from '@/components/legal/LegalDoc';
import { useLocale } from '@/contexts/LocaleContext';
import { pageMeta } from '@/lib/seo';

export function generateMetadata() {
  return pageMeta({
    title: 'Siguranță și bune practici',
    description:
      'Sfaturi de siguranță MaterialLoop pentru ridicare materiale, întâlniri și tranzacții pe marketplace.',
    path: '/legal/safety',
  });
}

export default function SafetyScreen() {
  const { locale } = useLocale();
  return <LegalDoc id="safety" locale={locale} />;
}