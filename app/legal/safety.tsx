import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '@/lib/theme';

export default function SafetyScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
      <Text style={styles.title}>Siguranță materiale</Text>
      <Text style={styles.p}>
        Distinge clar între materiale noi neatins, ambalaj deschis, parțial folosite și recuperate.
        Pentru vopsele, adezivi și chimicale deschise, menționează condițiile de depozitare
        (temperatură, umiditate, data aproximativă a deschiderii).
      </Text>
      <Text style={styles.p}>
        Nu lista azbest, substanțe toxice neregulamentare, materiale radioactive sau produse furate.
        Raportează anunțurile suspecte — moderarea completă urmează în etapa de administrație.
      </Text>
      <Text style={styles.p}>
        La întâlniri pentru ridicare, alege locuri publice când e posibil și verifică materialul înainte
        de plată.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  p: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 24, color: colors.ink },
});
