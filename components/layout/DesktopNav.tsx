import { usePathname, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { colors, fonts, radii, spacing } from '@/lib/theme';

export function DesktopNav() {
  const pathname = usePathname();
  const { user, can } = useAuth();
  const { t } = useLocale();

  const links = [
    { href: '/', label: t('nav.home'), match: (p: string) => p === '/' || p === '/index' },
    { href: '/search', label: t('nav.search'), match: (p: string) => p.startsWith('/search') },
    {
      href: '/sell',
      label: t('nav.sell'),
      match: (p: string) =>
        p.startsWith('/sell') || p.startsWith('/listing/create') || p.startsWith('/my-listings'),
    },
    { href: '/favorites', label: t('nav.favorites'), match: (p: string) => p.startsWith('/favorites') },
    { href: '/messages', label: t('nav.messages'), match: (p: string) => p.startsWith('/messages') },
    { href: '/contact', label: t('nav.contact'), match: (p: string) => p.startsWith('/contact') },
    ...(can('admin.panel')
      ? [
          {
            href: '/admin',
            label: t('nav.admin'),
            match: (p: string) => p.startsWith('/admin'),
          },
        ]
      : []),
    {
      href: '/profile',
      label: t('nav.profile'),
      match: (p: string) => p.startsWith('/profile') || p.startsWith('/u/'),
    },
  ];

  return (
    <View style={styles.bar}>
      <Pressable onPress={() => router.push('/')} accessibilityRole="link">
        <Text style={styles.brand}>{t('common.brand')}</Text>
      </Pressable>
      <View style={styles.links}>
        {links.map((link) => {
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
        <LanguageSelector />
        {user ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t('nav.profile')}
            onPress={() => router.push('/profile')}
            hitSlop={8}
          >
            <Text style={styles.user} numberOfLines={1}>
              {user.displayName}
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginText}>{t('nav.login')}</Text>
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
    color: colors.brand,
    fontSize: 14,
    maxWidth: 160,
    textDecorationLine: 'underline',
  },
  loginBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  loginText: { fontFamily: fonts.sansBold, color: colors.white, fontSize: 14 },
});
