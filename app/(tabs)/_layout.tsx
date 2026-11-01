import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, router } from 'expo-router';
import { colors, fonts } from '@/lib/theme';

function TabIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} name={props.name} color={props.color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11 },
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontFamily: fonts.sansBold, color: colors.ink },
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
            // When a listing detail is open above tabs, always return to home.
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
          href: '/messages',
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
  );
}
