import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '@/lib/theme';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
      <Text style={styles.title}>Termeni MaterialLoop</Text>
      <Text style={styles.p}>
        MaterialLoop este un marketplace care conectează persoane și firme care au materiale de
        construcții rămase cu cei care au nevoie de cantități mici. Platforma nu vinde materiale,
        nu intermediază plăți și nu garantează calitatea, starea sau legalitatea bunurilor listate.
      </Text>
      <Text style={styles.p}>
        Tranzacțiile, livrarea și plata se stabilesc direct între utilizatori. Adresele exacte nu
        trebuie publicate în anunț; partajați-le doar în conversații private.
      </Text>
      <Text style={styles.p}>
        Este interzisă listarea materialelor periculoase, contrafăcute sau obținute ilegal. Anunțurile
        cu chimicale, vopsele sau adezivi deschiși trebuie să includă starea și note de depozitare.
      </Text>
      <Link href="/legal/safety" asChild>
        <Pressable>
          <Text style={styles.link}>Citește regulile de siguranță →</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  p: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 24, color: colors.ink },
  link: { fontFamily: fonts.sansBold, color: colors.brand, marginTop: spacing.md },
});
