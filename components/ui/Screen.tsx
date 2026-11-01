import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';

export function Screen({
  children,
  scroll,
  style,
  contentStyle,
  narrow,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  narrow?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { isDesktop, contentPad } = useResponsive();
  const padTop = Math.max(insets.top, isDesktop ? spacing.lg : spacing.sm);

  const inner = (
    <View
      style={[
        styles.inner,
        {
          paddingHorizontal: contentPad,
          paddingTop: padTop,
          paddingBottom: Math.max(insets.bottom, spacing.xl),
          maxWidth: narrow ? layout.contentNarrow : isDesktop ? layout.contentMax : undefined,
          alignSelf: isDesktop || narrow ? 'center' : undefined,
          width: '100%',
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1 },
  inner: { flexGrow: 1, gap: spacing.md },
});
