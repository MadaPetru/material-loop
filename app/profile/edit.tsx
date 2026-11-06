import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LocationPicker } from '@/components/LocationPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getCity } from '@/data/romania';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { formatRoPhoneDisplay, normalizeRoPhone } from '@/lib/phone';
import { colors, fonts, radii, spacing } from '@/lib/theme';

export default function EditProfileScreen() {
  const { user, updateProfile, requestPhoneVerification, confirmPhoneVerification, clearPhone, isDemo } =
    useAuth();
  const { t } = useLocale();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [countyId, setCountyId] = useState<string | null>(
    user?.cityId ? user.cityId.split('-')[0] : 'bh',
  );
  const [cityId, setCityId] = useState<string | null>(user?.cityId ?? 'bh-oradea');
  const [busy, setBusy] = useState(false);

  const [phoneInput, setPhoneInput] = useState(
    user?.phone ? formatRoPhoneDisplay(user.phone) : '',
  );
  const [otp, setOtp] = useState('');
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [changingPhone, setChangingPhone] = useState(false);

  const verified = Boolean(user?.phone && user.phoneVerifiedAt);
  const showPhoneForm = !verified || changingPhone;

  const phoneError = useMemo(() => {
    if (!phoneInput.trim()) return undefined;
    return normalizeRoPhone(phoneInput) ? undefined : t('profile.phoneInvalid');
  }, [phoneInput, t]);

  if (!user) {
    return (
      <View style={styles.root}>
        <Text style={styles.msg}>{t('profile.notSignedIn')}</Text>
      </View>
    );
  }

  const save = async () => {
    const city = cityId ? getCity(cityId) : null;
    setBusy(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || user.displayName,
        bio: bio.trim() || null,
        cityId,
        lat: city?.lat ?? user.lat,
        lng: city?.lng ?? user.lng,
      });
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('profile.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    const normalized = normalizeRoPhone(phoneInput);
    if (!normalized) {
      Alert.alert(t('common.error'), t('profile.phoneInvalid'));
      return;
    }
    setPhoneBusy(true);
    try {
      const res = await requestPhoneVerification(normalized);
      setPendingPhone(res.phone);
      setDemoCode(res.demoCode ?? null);
      setOtp('');
      Alert.alert(
        t('profile.phone'),
        res.demoCode
          ? `${t('profile.codeSent', { phone: formatRoPhoneDisplay(res.phone) })}\n${t('profile.demoCodeHint', { code: res.demoCode })}`
          : t('profile.codeSent', { phone: formatRoPhoneDisplay(res.phone) }),
      );
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('profile.saveFailed'));
    } finally {
      setPhoneBusy(false);
    }
  };

  const verify = async () => {
    const phone = pendingPhone ?? normalizeRoPhone(phoneInput);
    if (!phone) {
      Alert.alert(t('common.error'), t('profile.phoneInvalid'));
      return;
    }
    setPhoneBusy(true);
    try {
      await confirmPhoneVerification(phone, otp);
      setChangingPhone(false);
      setPendingPhone(null);
      setDemoCode(null);
      setOtp('');
      setPhoneInput(formatRoPhoneDisplay(phone));
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('profile.saveFailed'));
    } finally {
      setPhoneBusy(false);
    }
  };

  const removePhone = async () => {
    setPhoneBusy(true);
    try {
      await clearPhone();
      setPhoneInput('');
      setPendingPhone(null);
      setChangingPhone(false);
      setOtp('');
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('profile.saveFailed'));
    } finally {
      setPhoneBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
      <Text style={styles.title}>{t('profile.editTitle')}</Text>
      <Input label={t('profile.displayName')} value={displayName} onChangeText={setDisplayName} />
      <Input
        label={t('profile.bio')}
        value={bio}
        onChangeText={setBio}
        multiline
        style={{ minHeight: 90, textAlignVertical: 'top' }}
      />
      <Text style={styles.label}>{t('profile.locationLabel')}</Text>
      <LocationPicker
        countyId={countyId}
        cityId={cityId}
        onChange={({ countyId: c, cityId: city }) => {
          setCountyId(c);
          setCityId(city);
        }}
      />

      <View style={styles.phoneCard}>
        <Text style={styles.phoneTitle}>{t('profile.phone')}</Text>
        <Text style={styles.phoneHint}>{t('profile.phoneHint')}</Text>

        {verified && !changingPhone ? (
          <View style={styles.verifiedRow}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={styles.verifiedPhone}>{formatRoPhoneDisplay(user.phone!)}</Text>
              <Text style={styles.verifiedBadge}>{t('profile.phoneVerified')}</Text>
            </View>
            <Button
              label={t('profile.changePhone')}
              variant="secondary"
              onPress={() => {
                setChangingPhone(true);
                setPhoneInput('');
                setPendingPhone(null);
                setOtp('');
              }}
              disabled={phoneBusy}
              style={{ flexShrink: 0 }}
            />
          </View>
        ) : null}

        {showPhoneForm ? (
          <>
            <Input
              label={t('profile.phone')}
              value={phoneInput}
              onChangeText={setPhoneInput}
              placeholder={t('profile.phonePlaceholder')}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              error={phoneError}
              editable={!phoneBusy}
            />
            <Button
              label={phoneBusy ? t('profile.sendingCode') : t('profile.sendCode')}
              variant="secondary"
              onPress={sendCode}
              disabled={phoneBusy || Boolean(phoneError) || !phoneInput.trim()}
            />
            {pendingPhone ? (
              <>
                <Input
                  label={t('profile.codeLabel')}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder={t('profile.codePlaceholder')}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!phoneBusy}
                />
                {isDemo && demoCode ? (
                  <Text style={styles.demoHint}>{t('profile.demoCodeHint', { code: demoCode })}</Text>
                ) : null}
                <Button
                  label={phoneBusy ? t('profile.verifying') : t('profile.verifyCode')}
                  onPress={verify}
                  disabled={phoneBusy || otp.trim().length !== 6}
                />
              </>
            ) : null}
            {verified ? (
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => {
                  setChangingPhone(false);
                  setPhoneInput(formatRoPhoneDisplay(user.phone!));
                  setPendingPhone(null);
                  setOtp('');
                }}
                disabled={phoneBusy}
              />
            ) : null}
          </>
        ) : null}

        {verified ? (
          <Button
            label={t('profile.removePhone')}
            variant="ghost"
            onPress={removePhone}
            disabled={phoneBusy}
          />
        ) : null}
      </View>

      <Button label={busy ? t('profile.saving') : t('profile.save')} onPress={save} disabled={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  label: { fontFamily: fonts.sansMedium, color: colors.inkMuted, fontSize: 13 },
  msg: { fontFamily: fonts.sans, color: colors.inkMuted, padding: spacing.xl },
  phoneCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  phoneTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  phoneHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, lineHeight: 18 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  verifiedPhone: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
  verifiedBadge: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.brand,
  },
  demoHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.accent },
});
