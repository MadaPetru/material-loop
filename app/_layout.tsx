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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConsentProvider } from '@/contexts/ConsentContext';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext';
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
    <SafeAreaProvider>
      <LocaleProvider>
        <ConsentProvider>
          <AuthProvider>
            <UnreadMessagesProvider>
              <StatusBar style="dark" />
              <RootNavigator />
              <CookieConsentBanner />
            </UnreadMessagesProvider>
          </AuthProvider>
        </ConsentProvider>
      </LocaleProvider>
    </SafeAreaProvider>
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
      <Stack.Screen name="my-listings" options={{ title: t('myListings.title') }} />
      <Stack.Screen name="legal/privacy" options={{ title: t('legal.privacy') }} />
      <Stack.Screen name="legal/cookies" options={{ title: t('legal.cookies') }} />
      <Stack.Screen name="legal/terms" options={{ title: t('legal.terms') }} />
      <Stack.Screen name="legal/safety" options={{ title: t('legal.safety') }} />
    </Stack>
  );
}
