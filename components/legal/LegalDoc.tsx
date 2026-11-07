import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getLegalDocument, type LegalDocId } from '@/lib/legal/content';
import { colors, fonts, spacing } from '@/lib/theme';
import type { AppLocale } from '@/locales/types';

type Props = {
  id: LegalDocId;
  locale: AppLocale;
  footer?: ReactNode;
};

export function LegalDoc({ id, locale, footer }: Props) {
  const doc = getLegalDocument(id, locale);
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{doc.title}</Text>
      <Text style={styles.intro}>{doc.intro}</Text>
      {doc.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.paragraphs.map((p) => (
            <Text key={p.slice(0, 48)} style={styles.p}>
              {p}
            </Text>
          ))}
        </View>
      ))}
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  intro: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, color: colors.inkMuted },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  heading: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  p: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 24, color: colors.ink },
});
