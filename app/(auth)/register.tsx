import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function RegisterScreen() {
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const { t } = useLocale();
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
    if (!displayName.trim()) next.displayName = t('auth.nameRequired');
    if (!email.trim() || !email.includes('@')) next.email = t('auth.emailInvalid');
    if (password.length < 6) next.password = t('auth.passwordMin');
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) {
      setError(t('auth.checkFields'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/profile');
    } catch (e) {
      setError(toUserError(e));
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
      setError(toUserError(e, t('errors.googleInterrupted')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll narrow>
      <LanguageSelector />
      <Text style={styles.brand}>{t('common.brand')}</Text>
      <Text style={styles.title}>{t('auth.registerTitle')}</Text>
      <Text style={styles.sub}>{t('auth.registerSub')}</Text>
      <ErrorBanner message={error} />
      <Input
        label={t('auth.displayName')}
        value={displayName}
        onChangeText={setDisplayName}
        error={fieldErrors.displayName}
      />
      <Input
        label={t('auth.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
      />
      <Input
        label={t('auth.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
      />
      <Button
        label={busy ? t('auth.creating') : t('auth.createAccount')}
        onPress={onSubmit}
        disabled={busy}
      />
      <Button
        label={busy ? t('auth.openingGoogle') : t('auth.continueGoogle')}
        variant="secondary"
        onPress={onGoogle}
        disabled={busy}
      />
      <Link href="/(auth)/login" asChild>
        <Pressable>
          <Text style={styles.link}>{t('auth.hasAccount')}</Text>
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
