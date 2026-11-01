import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, spacing } from '@/lib/theme';
import { toUserError, USER_COPY } from '@/lib/userErrors';

export default function LoginScreen() {
  const { signIn, signInWithGoogle, isDemo } = useAuth();
  const [email, setEmail] = useState(isDemo ? 'demo@materialloop.ro' : '');
  const [password, setPassword] = useState(isDemo ? 'demo1234' : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (busy) return;
    if (!email.trim() || !password) {
      setError('Completează emailul și parola.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password.trim());
      router.replace('/profile');
    } catch (e) {
      setError(toUserError(e, USER_COPY.unknown));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      const profile = await signInWithGoogle();
      if (profile) router.replace('/profile');
    } catch (e) {
      setError(toUserError(e, USER_COPY.googleInterrupted));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll narrow>
      <Text style={styles.brand}>MaterialLoop</Text>
      <Text style={styles.title}>Intră în cont</Text>
      {isDemo ? (
        <Text style={styles.hint}>Demo: demo@materialloop.ro / demo1234</Text>
      ) : null}
      <ErrorBanner message={error} />
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setError(null);
        }}
      />
      <Input
        label="Parolă"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setError(null);
        }}
        onSubmitEditing={onSubmit}
      />
      <Button label={busy ? 'Se conectează…' : 'Autentificare'} onPress={onSubmit} disabled={busy} />
      <Button
        label={busy ? 'Se deschide Google…' : 'Continuă cu Google'}
        variant="secondary"
        onPress={onGoogle}
        disabled={busy}
      />
      <Link href="/(auth)/forgot-password" asChild>
        <Pressable>
          <Text style={styles.link}>Ai uitat parola?</Text>
        </Pressable>
      </Link>
      <Link href="/(auth)/register" asChild>
        <Pressable>
          <Text style={styles.link}>Nu ai cont? Înregistrează-te</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.brand },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, marginBottom: spacing.xs },
  hint: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13 },
  link: {
    fontFamily: fonts.sansMedium,
    color: colors.brand,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
