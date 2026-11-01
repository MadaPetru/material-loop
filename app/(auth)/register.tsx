import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, spacing } from '@/lib/theme';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!displayName.trim() || !email.trim() || password.length < 6) {
      Alert.alert('Verifică datele', 'Nume, email și o parolă de minim 6 caractere sunt obligatorii.');
      return;
    }
    setBusy(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/profile');
    } catch (e) {
      Alert.alert('Înregistrare eșuată', e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>MaterialLoop</Text>
      <Text style={styles.title}>Creează cont</Text>
      <Text style={styles.sub}>Un singur cont pentru cumpărare și vânzare.</Text>
      <Input label="Nume afișat" value={displayName} onChangeText={setDisplayName} />
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input label="Parolă" secureTextEntry value={password} onChangeText={setPassword} />
      <Button label={busy ? 'Se creează…' : 'Creează cont'} onPress={onSubmit} disabled={busy} />
      <Link href="/(auth)/login" asChild>
        <Pressable>
          <Text style={styles.link}>Ai deja cont? Autentifică-te</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, gap: spacing.md },
  brand: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.brand },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.sans, color: colors.inkMuted, marginBottom: spacing.sm },
  link: { fontFamily: fonts.sansMedium, color: colors.brand, textAlign: 'center', marginTop: spacing.sm },
});
