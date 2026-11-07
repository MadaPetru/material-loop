import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useConsent } from '@/contexts/ConsentContext';
import { useLocale } from '@/contexts/LocaleContext';
import { colors, fonts, radii, spacing } from '@/lib/theme';

export function CookieConsentBanner() {
  const { t } = useLocale();
  const {
    ready,
    preferences,
    customizeOpen,
    setCustomizeOpen,
    acceptAll,
    necessaryOnly,
    saveCustom,
  } = useConsent();

  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const undecided = ready && !preferences?.decidedAt;
  const showSheet = undecided || customizeOpen;

  if (!ready || !showSheet) return null;

  const openCustomize = () => {
    setAnalytics(preferences?.analytics ?? false);
    setMarketing(preferences?.marketing ?? false);
    setCustomizeOpen(true);
  };

  const body = (
    <View style={styles.sheet}>
      <Text style={styles.title}>{t('consent.title')}</Text>
      <Text style={styles.body}>{t('consent.body')}</Text>

      {customizeOpen ? (
        <View style={styles.toggles}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('consent.necessary')}</Text>
              <Text style={styles.rowSub}>{t('consent.necessaryHint')}</Text>
            </View>
            <Switch value={true} disabled trackColor={{ true: colors.brand }} />
          </View>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('consent.analytics')}</Text>
              <Text style={styles.rowSub}>{t('consent.analyticsHint')}</Text>
            </View>
            <Switch
              value={analytics}
              onValueChange={setAnalytics}
              trackColor={{ true: colors.brand }}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('consent.marketing')}</Text>
              <Text style={styles.rowSub}>{t('consent.marketingHint')}</Text>
            </View>
            <Switch
              value={marketing}
              onValueChange={setMarketing}
              trackColor={{ true: colors.brand }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => void saveCustom({ analytics, marketing })}
          >
            <Text style={styles.btnPrimaryText}>{t('consent.save')}</Text>
          </Pressable>
          {!undecided ? (
            <Pressable
              accessibilityRole="button"
              style={styles.btnGhost}
              onPress={() => setCustomizeOpen(false)}
            >
              <Text style={styles.btnGhostText}>{t('common.cancel')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => void acceptAll()}
          >
            <Text style={styles.btnPrimaryText}>{t('consent.acceptAll')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => void necessaryOnly()}
          >
            <Text style={styles.btnSecondaryText}>{t('consent.necessaryOnly')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.btnGhost} onPress={openCustomize}>
            <Text style={styles.btnGhostText}>{t('consent.customize')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  if (Platform.OS === 'web') {
    return <View style={styles.webDock}>{body}</View>;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => {}}>
      <View style={styles.modalRoot}>{body}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  webDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    paddingHorizontal: spacing.md,
    pointerEvents: 'box-none',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20,24,20,0.35)',
  },
  sheet: {
    backgroundColor: colors.bgElevated ?? colors.bg,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.ink },
  body: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: colors.inkMuted },
  actions: { gap: spacing.xs, marginTop: spacing.sm },
  toggles: { gap: spacing.md, marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  rowSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  btn: {
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { fontFamily: fonts.sansBold, color: colors.bg, fontSize: 15 },
  btnSecondary: { backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.line },
  btnSecondaryText: { fontFamily: fonts.sansBold, color: colors.ink, fontSize: 15 },
  btnGhost: { paddingVertical: 10, alignItems: 'center' },
  btnGhostText: { fontFamily: fonts.sansMedium, color: colors.brand, fontSize: 14 },
});
