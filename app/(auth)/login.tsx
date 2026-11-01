import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, spacing } from '@/lib/theme';

export default function LoginScreen() {
  const { signIn, signInWithGoogle, user, loading: authLoading, isDemo } = useAuth();
  const [email, setEmail] = useState(isDemo ? 'demo@materialloop.ro' : '');
  const [password, setPassword] = useState(isDemo ? 'demo1234' : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After Google web OAuth redirect (PKCE), session lands here → go to profile.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/profile');
    }
  }, [authLoading, user]);

  const onSubmit = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password.trim());
      router.replace('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare necunoscută');
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const profile = await signInWithGoogle();
      if (profile) {
        router.replace('/profile');
      }
      // Web: browser navigates away; on return the useEffect above redirects.
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Autentificarea Google a eșuat. Verifică configurația din Supabase (vezi README).'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>MaterialLoop</Text>
      <Text style={styles.title}>Intră în cont</Text>
      {isDemo ? (
        <Text style={styles.hint}>Demo: demo@materialloop.ro / demo1234</Text>
      ) : null}
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Parolă"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={onSubmit}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label={busy ? 'Se conectează…' : 'Autentificare'} onPress={onSubmit} disabled={busy} />
      <Button
        label={busy ? 'Se conectează…' : 'Continuă cu Google'}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  brand: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.brand },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, marginBottom: spacing.sm },
  hint: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13, marginTop: -spacing.sm },
  error: {
    fontFamily: fonts.sansMedium,
    color: colors.danger,
    fontSize: 14,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: 8,
  },
  link: {
    fontFamily: fonts.sansMedium,
    color: colors.brand,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
