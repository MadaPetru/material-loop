import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Input } from '@/components/ui/Input';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Screen } from '@/components/ui/Screen';
import { useLocale } from '@/contexts/LocaleContext';
import { getSupabase } from '@/lib/supabase';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts } from '@/lib/theme';
import { toUserError } from '@/lib/userErrors';
import * as Linking from 'expo-linking';

export default function ForgotPasswordScreen() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError(t('auth.emailInvalid'));
      return;
    }
    setError(null);

    if (marketplace.isDemo) {
      setError(t('auth.forgotDemo'));
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setError(t('auth.forgotUnavailable'));
      return;
    }

    setBusy(true);
    try {
      const redirectTo = Linking.createURL('/(auth)/login');
      const { error: resetError } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) throw resetError;
      setDone(true);
    } catch (e) {
      setError(toUserError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll narrow>
      <LanguageSelector />
      <Text style={styles.title}>{t('auth.forgotTitle')}</Text>
      <Text style={styles.sub}>{t('auth.forgotSub')}</Text>
      <ErrorBanner message={error} />
      {done ? (
        <Text style={styles.success}>{t('auth.resetSuccess', { email: email.trim() })}</Text>
      ) : (
        <>
          <Input
            label={t('auth.email')}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError(null);
            }}
            error={error && !email.includes('@') ? error : undefined}
          />
          <Button
            label={busy ? t('auth.sending') : t('auth.sendLink')}
            onPress={onSubmit}
            disabled={busy}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.sans, color: colors.inkMuted, lineHeight: 22 },
  success: {
    fontFamily: fonts.sansMedium,
    color: colors.brandDark,
    backgroundColor: colors.brandSoft,
    padding: 16,
    borderRadius: 12,
    lineHeight: 22,
  },
});
