import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  SourceSerif4_600SemiBold,
  SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/lib/auth/oauth';
import { colors } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    SourceSerif4_600SemiBold,
    SourceSerif4_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: 'DMSans_700Bold' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: 'Autentificare' }} />
        <Stack.Screen name="(auth)/register" options={{ title: 'Creare cont' }} />
        <Stack.Screen name="(auth)/forgot-password" options={{ title: 'Recuperare parolă' }} />
        <Stack.Screen name="listing/[id]" options={{ title: 'Anunț' }} />
        <Stack.Screen name="listing/create" options={{ title: 'Publică material' }} />
        <Stack.Screen name="listing/[id]/edit" options={{ title: 'Editează anunț' }} />
        <Stack.Screen name="u/[id]" options={{ title: 'Profil vânzător' }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Editează profil' }} />
        <Stack.Screen name="legal/terms" options={{ title: 'Termeni' }} />
        <Stack.Screen name="legal/safety" options={{ title: 'Siguranță' }} />
      </Stack>
    </AuthProvider>
  );
}
