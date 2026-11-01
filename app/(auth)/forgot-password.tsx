import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { getSupabase } from '@/lib/supabase';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts } from '@/lib/theme';
import { toUserError } from '@/lib/userErrors';
import * as Linking from 'expo-linking';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Introdu un email valid.');
      return;
    }
    setError(null);

    if (marketplace.isDemo) {
      setError(
        'În modul demonstrație nu trimitem email. Folosește demo@materialloop.ro / demo1234.'
      );
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setError('Resetarea parolei nu e disponibilă momentan.');
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
      <Text style={styles.title}>Recuperare parolă</Text>
      <Text style={styles.sub}>
        Introdu emailul contului. Dacă există, îți trimitem un link de resetare.
      </Text>
      <ErrorBanner message={error} />
      {done ? (
        <Text style={styles.success}>
          Dacă există un cont pentru {email.trim()}, vei primi un email în scurt timp. Verifică și
          folderul Spam.
        </Text>
      ) : (
        <>
          <Input
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError(null);
            }}
            error={error && !email.includes('@') ? error : undefined}
          />
          <Button label={busy ? 'Se trimite…' : 'Trimite link'} onPress={onSubmit} disabled={busy} />
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
