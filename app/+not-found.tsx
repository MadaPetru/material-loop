import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Pagina lipsește' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Această pagină nu există.</Text>
        <Link href="/" style={styles.link}>
          Înapoi la MaterialLoop
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  link: { marginTop: spacing.lg, fontFamily: fonts.sansBold, color: colors.brand },
});
