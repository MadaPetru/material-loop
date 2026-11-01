import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, spacing } from '@/lib/theme';

export default function LoginScreen() {
  const { signIn, isDemo } = useAuth();
  const [email, setEmail] = useState(isDemo ? 'demo@materialloop.ro' : '');
  const [password, setPassword] = useState(isDemo ? 'demo1234' : '');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/profile');
    } catch (e) {
      Alert.alert('Autentificare eșuată', e instanceof Error ? e.message : 'Eroare necunoscută');
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    try {
      await marketplace.signInWithGoogle();
    } catch (e) {
      Alert.alert(
        'Google Sign-In',
        e instanceof Error
          ? e.message
          : 'Configurează credențialele Google în Supabase (vezi README).'
      );
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>MaterialLoop</Text>
      <Text style={styles.title}>Intră în cont</Text>
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Parolă"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button label={busy ? 'Se conectează…' : 'Autentificare'} onPress={onSubmit} disabled={busy} />
      <Button label="Continuă cu Google" variant="secondary" onPress={onGoogle} />
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
  link: {
    fontFamily: fonts.sansMedium,
    color: colors.brand,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
