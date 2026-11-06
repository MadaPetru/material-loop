import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, router } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { DesktopNav } from '@/components/layout/DesktopNav';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { colors, fonts } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';

function TabIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} name={props.name} color={props.color} />;
}

export default function TabLayout() {
  const { isDesktop, isTablet } = useResponsive();
  const { t, locale } = useLocale();
  const { can } = useAuth();
  const showAdmin = can('admin.panel');
  const hideTabBar = isDesktop;

  return (
    <View style={styles.root} key={locale}>
      {isDesktop ? <DesktopNav /> : null}
      {!isDesktop ? (
        <View style={styles.mobileLang}>
          <LanguageSelector />
        </View>
      ) : null}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.inkFaint,
          tabBarStyle: hideTabBar
            ? { display: 'none', height: 0 }
            : {
                backgroundColor: colors.bgElevated,
                borderTopColor: colors.line,
                height: isTablet ? 64 : undefined,
                paddingBottom: Platform.OS === 'ios' ? undefined : 6,
              },
          tabBarLabelStyle: {
            fontFamily: fonts.sansMedium,
            fontSize: isTablet ? 12 : 11,
          },
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontFamily: fonts.sansBold, color: colors.ink },
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.home'),
            href: '/',
            tabBarIcon: ({ color }) => <TabIcon name="home" color={String(color)} />,
            headerShown: false,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.navigate('/');
            },
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: t('nav.search'),
            href: '/search',
            headerShown: !isDesktop,
            tabBarIcon: ({ color }) => <TabIcon name="search" color={String(color)} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.navigate('/search');
            },
          }}
        />
        <Tabs.Screen
          name="sell"
          options={{
            title: t('nav.sell'),
            href: '/sell',
            tabBarIcon: ({ color }) => <TabIcon name="plus-circle" color={String(color)} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: t('nav.favorites'),
            href: '/favorites',
            tabBarIcon: ({ color }) => <TabIcon name="heart" color={String(color)} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: t('nav.messages'),
            href: '/messages',
            headerShown: !isDesktop,
            tabBarIcon: ({ color }) => <TabIcon name="comments" color={String(color)} />,
          }}
        />
        <Tabs.Screen
          name="contact"
          options={{
            title: t('nav.contact'),
            href: '/contact',
            headerShown: !isDesktop,
            tabBarIcon: ({ color }) => <TabIcon name="envelope" color={String(color)} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.navigate('/contact');
            },
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: t('nav.admin'),
            href: showAdmin ? '/admin' : null,
            headerShown: !isDesktop,
            tabBarIcon: ({ color }) => <TabIcon name="shield" color={String(color)} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              if (showAdmin) router.navigate('/admin');
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav.profile'),
            href: '/profile',
            tabBarIcon: ({ color }) => <TabIcon name="user" color={String(color)} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.navigate('/profile');
            },
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  mobileLang: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 48,
    right: 16,
    zIndex: 20,
  },
});
