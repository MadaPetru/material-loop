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
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';
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
    <LocaleProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </LocaleProvider>
  );
}

function RootNavigator() {
  const { t, locale } = useLocale();

  return (
    <Stack
      key={locale}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: 'DMSans_700Bold' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ title: t('nav.login') }} />
      <Stack.Screen name="(auth)/register" options={{ title: t('auth.createAccount') }} />
      <Stack.Screen name="(auth)/forgot-password" options={{ title: t('auth.forgotTitle') }} />
      <Stack.Screen name="listing/[id]" options={{ title: t('messages.listingFallback') }} />
      <Stack.Screen name="listing/create" options={{ title: t('home.publish') }} />
      <Stack.Screen name="listing/[id]/edit" options={{ title: t('listing.edit') }} />
      <Stack.Screen name="u/[id]" options={{ title: t('nav.profile') }} />
      <Stack.Screen name="profile/edit" options={{ title: t('profile.editProfile') }} />
      <Stack.Screen name="legal/terms" options={{ title: 'Terms' }} />
      <Stack.Screen name="legal/safety" options={{ title: 'Safety' }} />
    </Stack>
  );
}
