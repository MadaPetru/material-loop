import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { SUPPORT_EMAIL, buildContactMailto, type ContactTopic } from '@/lib/contact';
import { toUserError } from '@/lib/userErrors';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';

export default function ContactScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { isDesktop } = useResponsive();
  const [topic, setTopic] = useState<ContactTopic>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyEmail, setReplyEmail] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentHint, setSentHint] = useState(false);

  const topics = useMemo(
    () =>
      [
        { id: 'bug' as const, label: t('contact.topicBug') },
        { id: 'change' as const, label: t('contact.topicChange') },
        { id: 'other' as const, label: t('contact.topicOther') },
      ] as const,
    [t],
  );

  const send = async () => {
    setError(null);
    setSentHint(false);
    if (!message.trim()) {
      setError(t('contact.messageRequired'));
      return;
    }
    setBusy(true);
    try {
      const url = buildContactMailto({
        topic,
        subject,
        message,
        replyEmail: replyEmail.trim() || user?.email || null,
        displayName: user?.displayName ?? null,
        userId: user?.id ?? null,
      });
      await Linking.openURL(url);
      setSentHint(true);
    } catch (e) {
      setError(toUserError(e, t('contact.openMailFailed')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll narrow>
      <View style={[styles.panel, isDesktop && styles.panelDesktop]}>
        <Text style={styles.eyebrow}>{t('contact.eyebrow')}</Text>
        <Text style={styles.title}>{t('contact.title')}</Text>
        <Text style={styles.sub}>{t('contact.sub')}</Text>
        <Text style={styles.toLine}>
          {t('contact.to')}: <Text style={styles.toEmail}>{SUPPORT_EMAIL}</Text>
        </Text>

        <Text style={styles.label}>{t('contact.topic')}</Text>
        <View style={styles.chips}>
          {topics.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              selected={topic === item.id}
              onPress={() => setTopic(item.id)}
            />
          ))}
        </View>

        <Input
          label={t('contact.subject')}
          value={subject}
          onChangeText={setSubject}
          placeholder={t('contact.subjectPlaceholder')}
        />
        <Input
          label={t('contact.replyEmail')}
          value={replyEmail}
          onChangeText={setReplyEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder={t('contact.replyEmailPlaceholder')}
        />
        <Input
          label={t('contact.message')}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder={t('contact.messagePlaceholder')}
          style={styles.message}
        />

        {error ? <ErrorBanner message={error} /> : null}
        {sentHint ? <Text style={styles.hint}>{t('contact.openedMail')}</Text> : null}

        <Button
          label={busy ? t('contact.sending') : t('contact.send')}
          onPress={send}
          disabled={busy}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
  },
  panelDesktop: {
    marginTop: spacing.xl,
    padding: spacing.xxl,
  },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, lineHeight: 34 },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  toLine: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkMuted },
  toEmail: { fontFamily: fonts.sansBold, color: colors.brand },
  label: { fontFamily: fonts.sansMedium, color: colors.inkMuted, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  message: { minHeight: 140, textAlignVertical: 'top', paddingTop: spacing.md },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.brand,
    lineHeight: 20,
  },
});
