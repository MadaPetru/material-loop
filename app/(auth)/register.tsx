import { Link, router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthLegalNotice } from '@/components/legal/AuthLegalNotice';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Input } from '@/components/ui/Input';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { isEmailConfirmRequiredError } from '@/lib/auth/errors';
import { colors, fonts, radii, spacing } from '@/lib/theme';
import { toUserError } from '@/lib/userErrors';

export default function RegisterScreen() {
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNotice, setConfirmNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
  }>({});

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [authLoading, user]);

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!displayName.trim()) next.displayName = t('auth.nameRequired');
    if (!email.trim() || !email.includes('@')) next.email = t('auth.emailInvalid');
    if (password.trim().length < 6) next.password = t('auth.passwordMin');
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
    setConfirmNotice(null);
    try {
      await signUp(email.trim(), password.trim(), displayName.trim());
      router.replace('/');
    } catch (e) {
      if (isEmailConfirmRequiredError(e)) {
        setConfirmNotice(t('auth.checkEmailToContinue', { email: email.trim() }));
      } else {
        setError(toUserError(e));
      }
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
      if (profile) router.replace('/');
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
      {confirmNotice ? <Text style={styles.success}>{confirmNotice}</Text> : null}
      {!confirmNotice ? (
        <>
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
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
          />
          <Input
            label={t('auth.password')}
            secureTextEntry
            autoComplete="new-password"
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
        </>
      ) : (
        <Button
          label={t('auth.backToLogin')}
          onPress={() => router.replace('/(auth)/login' as Href)}
        />
      )}
      <Link href="/(auth)/login" asChild>
        <Pressable>
          <Text style={styles.link}>{t('auth.hasAccount')}</Text>
        </Pressable>
      </Link>
      <AuthLegalNotice />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.brand },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.sans, color: colors.inkMuted, marginBottom: spacing.sm },
  success: {
    fontFamily: fonts.sansMedium,
    color: colors.brandDark,
    backgroundColor: colors.brandSoft,
    padding: spacing.lg,
    borderRadius: radii.md,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  link: {
    fontFamily: fonts.sansMedium,
    color: colors.brand,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
