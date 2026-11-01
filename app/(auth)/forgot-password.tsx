import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { marketplace } from '@/lib/api/marketplace';
import { colors, fonts, spacing } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  const onSubmit = () => {
    if (marketplace.isDemo) {
      Alert.alert(
        'Mod demonstrație',
        'Recuperarea parolei prin email funcționează după conectarea Supabase. În demo folosește demo@materialloop.ro / demo1234.'
      );
      return;
    }
    Alert.alert('Verifică emailul', 'Dacă există un cont, vei primi un link de resetare.');
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Recuperare parolă</Text>
      <Text style={styles.sub}>Introdu emailul contului. Îți trimitem un link de resetare.</Text>
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Button label="Trimite link" onPress={onSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.sans, color: colors.inkMuted, lineHeight: 22 },
});
