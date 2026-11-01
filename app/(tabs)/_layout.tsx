import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, router } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { DesktopNav } from '@/components/layout/DesktopNav';
import { LanguageHint } from '@/components/ui/LanguageHint';
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
  const hideTabBar = isDesktop;

  return (
    <View style={styles.root}>
      {isDesktop ? <DesktopNav /> : null}
      {!isDesktop ? (
        <View style={styles.mobileLang}>
          <LanguageHint />
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
            title: 'Acasă',
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
            title: 'Caută',
            href: '/search',
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
            title: 'Vinde',
            href: '/sell',
            tabBarIcon: ({ color }) => <TabIcon name="plus-circle" color={String(color)} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorite',
            href: '/favorites',
            tabBarIcon: ({ color }) => <TabIcon name="heart" color={String(color)} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Mesaje',
            href: isDesktop ? null : '/messages',
            tabBarIcon: ({ color }) => <TabIcon name="comments" color={String(color)} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
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
