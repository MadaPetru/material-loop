import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/lib/theme';

export default function MessagesScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Mesaje</Text>
      <Text style={styles.sub}>
        Chat-ul între cumpărători și vânzători vine în următoarea etapă. Pentru moment, poți salva
        anunțuri la Favorite și urmări vânzătorii din pagina de detaliu.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.sans, fontSize: 16, color: colors.inkMuted, lineHeight: 24 },
});
