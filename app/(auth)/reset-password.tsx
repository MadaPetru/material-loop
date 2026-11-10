import { Link, router, type Href } from 'expo-router';
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

export default function ResetPasswordScreen() {
  const { updatePassword, signOut, user, loading: authLoading, isDemo } = useAuth();
  const { t } = useLocale();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading || isDemo) return;
    // Recovery links create a short-lived session before this screen opens.
    if (!user) {
      setError(t('auth.resetSessionMissing'));
    }
  }, [authLoading, user, isDemo, t]);

  const onSubmit = async () => {
    if (busy) return;
    if (password.trim().length < 6) {
      setError(t('auth.passwordMin'));
      return;
    }
    if (password.trim() !== confirm.trim()) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await updatePassword(password.trim());
      setDone(true);
      await signOut();
    } catch (e) {
      setError(toUserError(e));
    } finally {
      setBusy(false);
    }
  };

  if (isDemo) {
    return (
      <Screen scroll narrow>
        <LanguageSelector />
        <Text style={styles.title}>{t('auth.resetTitle')}</Text>
        <Text style={styles.sub}>{t('auth.forgotDemo')}</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={styles.link}>{t('auth.backToLogin')}</Text>
          </Pressable>
        </Link>
      </Screen>
    );
  }

  return (
    <Screen scroll narrow>
      <LanguageSelector />
      <Text style={styles.title}>{t('auth.resetTitle')}</Text>
      <Text style={styles.sub}>{t('auth.resetSub')}</Text>
      <ErrorBanner message={error} />
      {done ? (
        <>
          <Text style={styles.success}>{t('auth.resetDone')}</Text>
          <Button
            label={t('auth.backToLogin')}
            onPress={() => router.replace('/(auth)/login' as Href)}
          />
        </>
      ) : (
        <>
          <Input
            label={t('auth.newPassword')}
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError(null);
            }}
          />
          <Input
            label={t('auth.confirmPassword')}
            secureTextEntry
            autoComplete="new-password"
            value={confirm}
            onChangeText={(v) => {
              setConfirm(v);
              setError(null);
            }}
            onSubmitEditing={onSubmit}
          />
          <Button
            label={busy ? t('auth.savingPassword') : t('auth.savePassword')}
            onPress={onSubmit}
            disabled={busy || !user}
          />
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable>
              <Text style={styles.link}>{t('auth.requestNewLink')}</Text>
            </Pressable>
          </Link>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.sans, color: colors.inkMuted, lineHeight: 22, marginBottom: spacing.sm },
  success: {
    fontFamily: fonts.sansMedium,
    color: colors.brandDark,
    backgroundColor: colors.brandSoft,
    padding: 16,
    borderRadius: 12,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  link: {
    fontFamily: fonts.sansMedium,
    color: colors.brand,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
