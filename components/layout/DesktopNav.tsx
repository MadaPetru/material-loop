import { usePathname, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LanguageHint } from '@/components/ui/LanguageHint';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, radii, spacing } from '@/lib/theme';

const LINKS = [
  { href: '/', label: 'Acasă', match: (p: string) => p === '/' || p === '/index' },
  { href: '/search', label: 'Caută', match: (p: string) => p.startsWith('/search') },
  { href: '/sell', label: 'Vinde', match: (p: string) => p.startsWith('/sell') || p.startsWith('/listing/create') },
  { href: '/favorites', label: 'Favorite', match: (p: string) => p.startsWith('/favorites') },
  { href: '/profile', label: 'Profil', match: (p: string) => p.startsWith('/profile') || p.startsWith('/u/') },
] as const;

export function DesktopNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <View style={styles.bar}>
      <Pressable onPress={() => router.push('/')} accessibilityRole="link">
        <Text style={styles.brand}>MaterialLoop</Text>
      </Pressable>
      <View style={styles.links}>
        {LINKS.map((link) => {
          const active = link.match(pathname);
          return (
            <Pressable
              key={link.href}
              accessibilityRole="link"
              style={[styles.link, active && styles.linkActive]}
              onPress={() => router.push(link.href as '/')}
            >
              <Text style={[styles.linkText, active && styles.linkTextActive]}>{link.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.right}>
        <LanguageHint />
        {user ? (
          <Text style={styles.user} numberOfLines={1}>
            {user.displayName}
          </Text>
        ) : (
          <Pressable style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginText}>Autentificare</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.brand,
    minWidth: 160,
  },
  links: { flex: 1, flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  link: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  linkActive: { backgroundColor: colors.brandSoft },
  linkText: { fontFamily: fonts.sansMedium, color: colors.inkMuted, fontSize: 14 },
  linkTextActive: { color: colors.brandDark, fontFamily: fonts.sansBold },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  user: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    fontSize: 14,
    maxWidth: 160,
  },
  loginBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  loginText: { fontFamily: fonts.sansBold, color: colors.white, fontSize: 14 },
});
