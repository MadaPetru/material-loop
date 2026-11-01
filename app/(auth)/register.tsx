import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, spacing } from '@/lib/theme';
import { toUserError, USER_COPY } from '@/lib/userErrors';

export default function RegisterScreen() {
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
  }>({});

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/profile');
    }
  }, [authLoading, user]);

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!displayName.trim()) next.displayName = 'Introdu un nume afișat.';
    if (!email.trim() || !email.includes('@')) next.email = 'Introdu un email valid.';
    if (password.length < 6) next.password = 'Minim 6 caractere.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) {
      setError('Verifică câmpurile marcate.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/profile');
    } catch (e) {
      setError(toUserError(e, USER_COPY.unknown));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
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
      <Text style={styles.title}>Creează cont</Text>
      <Text style={styles.sub}>Un singur cont pentru cumpărare și vânzare.</Text>
      <ErrorBanner message={error} />
      <Input
        label="Nume afișat"
        value={displayName}
        onChangeText={setDisplayName}
        error={fieldErrors.displayName}
      />
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
      />
      <Input
        label="Parolă"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
      />
      <Button label={busy ? 'Se creează…' : 'Creează cont'} onPress={onSubmit} disabled={busy} />
      <Button
        label={busy ? 'Se deschide Google…' : 'Continuă cu Google'}
        variant="secondary"
        onPress={onGoogle}
        disabled={busy}
      />
      <Link href="/(auth)/login" asChild>
        <Pressable>
          <Text style={styles.link}>Ai deja cont? Autentifică-te</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.brand },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.sans, color: colors.inkMuted, marginBottom: spacing.sm },
  link: {
    fontFamily: fonts.sansMedium,
    color: colors.brand,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
