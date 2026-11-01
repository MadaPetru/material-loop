import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
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
          tabBarIcon: ({ color }) => <TabIcon name="home" color={String(color)} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Caută',
          tabBarIcon: ({ color }) => <TabIcon name="search" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Vinde',
          tabBarIcon: ({ color }) => <TabIcon name="plus-circle" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorite',
          tabBarIcon: ({ color }) => <TabIcon name="heart" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesaje',
          tabBarIcon: ({ color }) => <TabIcon name="comments" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon name="user" color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
