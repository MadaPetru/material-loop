import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Input } from '@/components/ui/Input';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { colors, fonts, spacing } from '@/lib/theme';
import { toUserError } from '@/lib/userErrors';

export default function LoginScreen() {
  const { signIn, signInWithGoogle, isDemo } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState(isDemo ? 'demo@materialloop.ro' : '');
  const [password, setPassword] = useState(isDemo ? 'demo1234' : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (busy) return;
    if (!email.trim() || !password) {
      setError(t('auth.fillEmailPassword'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password.trim());
      router.replace('/profile');
    } catch (e) {
      setError(toUserError(e));
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
      setError(toUserError(e, t('errors.googleInterrupted')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll narrow>
      <LanguageSelector />
      <Text style={styles.brand}>{t('common.brand')}</Text>
      <Text style={styles.title}>{t('auth.loginTitle')}</Text>
      {isDemo ? <Text style={styles.hint}>{t('auth.demoHint')}</Text> : null}
      <ErrorBanner message={error} />
      <Input
        label={t('auth.email')}
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
        label={t('auth.password')}
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setError(null);
        }}
        onSubmitEditing={onSubmit}
      />
      <Button
        label={busy ? t('auth.signingIn') : t('auth.signIn')}
        onPress={onSubmit}
        disabled={busy}
      />
      <Button
        label={busy ? t('auth.openingGoogle') : t('auth.continueGoogle')}
        variant="secondary"
        onPress={onGoogle}
        disabled={busy}
      />
      <Link href="/(auth)/forgot-password" asChild>
        <Pressable>
          <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
        </Pressable>
      </Link>
      <Link href="/(auth)/register" asChild>
        <Pressable>
          <Text style={styles.link}>{t('auth.noAccount')}</Text>
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
