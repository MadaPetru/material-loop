import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { marketplace } from '@/lib/api/marketplace';
import { buildAdminUserMailto } from '@/lib/contact';
import {
  ENTITLEMENT_GROUPS,
  filterKnownEntitlements,
  getRoleDefinitions,
  hasEntitlement,
  resolveEntitlements,
} from '@/lib/entitlements';
import { toUserError } from '@/lib/userErrors';
import { colors, fonts, layout, radii, spacing } from '@/lib/theme';
import { useResponsive } from '@/lib/useResponsive';
import type { AdminAnalytics, MarketingAd, Profile, RoleDefinition } from '@/lib/types';

type AdminSection = 'users' | 'roles' | 'marketing';
type PendingAction =
  | { type: 'deactivate'; user: Profile; deactivated: boolean }
  | { type: 'deleteRole'; role: RoleDefinition }
  | { type: 'deleteAd'; ad: MarketingAd }
  | null;

export default function AdminScreen() {
  const { user, can, refresh } = useAuth();
  const { t, locale } = useLocale();
  const { contentPad, isDesktop } = useResponsive();

  const allowed = can('admin.panel') || can('marketing.panel');
  const canReadUsers = can('admin.users.read') || can('admin.panel');
  const canManageUsers = can('admin.users.manage');
  const canSeeAnalytics = can('admin.analytics');
  const canManageRoles = can('admin.roles.manage') || can('admin.panel');
  const canMarketing = can('marketing.panel') || can('admin.panel');
  const canMarketingAds = can('marketing.ads') || can('admin.panel');
  const canOutreach = can('marketing.email') || can('admin.users.email') || can('admin.panel');

  const sections = useMemo(() => {
    const list: AdminSection[] = [];
    if (can('admin.panel') || canReadUsers) list.push('users');
    if (canManageRoles) list.push('roles');
    if (canMarketing) list.push('marketing');
    return list;
  }, [can, canReadUsers, canManageRoles, canMarketing]);

  const [section, setSection] = useState<AdminSection>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [ads, setAds] = useState<MarketingAd[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const [rolesEditor, setRolesEditor] = useState<Profile | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [mailTarget, setMailTarget] = useState<Profile[] | null>(null);
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [selectedMailIds, setSelectedMailIds] = useState<Set<string>>(new Set());
  const [recipientQuery, setRecipientQuery] = useState('');
  const [pickDraftOpen, setPickDraftOpen] = useState(false);

  const [roleForm, setRoleForm] = useState<{
    id: string;
    label: string;
    description: string;
    entitlements: string[];
    editing: boolean;
  } | null>(null);

  const [adForm, setAdForm] = useState<{
    id?: string;
    title: string;
    body: string;
    active: boolean;
  } | null>(null);

  const activeSection = sections.includes(section) ? section : sections[0] ?? 'users';

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const catalog = await marketplace.loadRoleCatalog();
      setRoles(catalog);
      await refresh();
      if (canReadUsers || canOutreach) {
        try {
          setUsers(await marketplace.adminListUsers());
        } catch {
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
      const stats = canSeeAnalytics ? await marketplace.adminGetAnalytics() : null;
      setAnalytics(stats);
      if (canMarketing) {
        try {
          setAds(await marketplace.listMarketingAds());
        } catch {
          setAds([]);
        }
      } else {
        setAds([]);
      }
    } catch (e) {
      setError(toUserError(e));
    } finally {
      setLoading(false);
    }
  }, [allowed, canReadUsers, canOutreach, canSeeAnalytics, canMarketing, refresh]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const entitlements = resolveEntitlements(u.roles);
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roles.some((r) => r.toLowerCase().includes(q)) ||
        entitlements.some((e) => e.toLowerCase().includes(q))
      );
    });
  }, [users, query]);

  /** LIKE-style recipient filter: substring match on email / name. */
  const filteredRecipients = useMemo(() => {
    const q = recipientQuery.trim().toLowerCase();
    const pool = users.filter((u) => u.email && !u.deactivatedAt);
    if (!q) return pool;
    return pool.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q),
    );
  }, [users, recipientQuery]);

  if (!user) {
    return (
      <View style={styles.center}>
        <EmptyState
          title={t('admin.gateTitle')}
          subtitle={t('admin.gateSub')}
          actionLabel={t('nav.login')}
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.center}>
        <EmptyState
          title={t('admin.forbiddenTitle')}
          subtitle={t('admin.forbiddenSub')}
          actionLabel={t('nav.home')}
          onAction={() => router.replace('/')}
        />
      </View>
    );
  }

  const selectedTargets = () =>
    users.filter((u) => selectedMailIds.has(u.id) && u.email);

  const openMail = (targets: Profile[], draft?: MarketingAd | null) => {
    setPickDraftOpen(false);
    setMailTarget(targets);
    if (draft) {
      setMailSubject(draft.title);
      setMailBody(draft.body);
      return;
    }
    setMailSubject(t('admin.emailSubjectDefault'));
    setMailBody(
      targets.length === 1 ? t('admin.emailBodyDefault') : t('admin.emailBodyDefaultMulti'),
    );
  };

  const openMailFromTemplate = (template: MarketingAd, targets?: Profile[]) => {
    const selected = targets?.length ? targets : selectedTargets();
    if (!selected.length) {
      setError(t('admin.needRecipients'));
      return;
    }
    setError(null);
    openMail(selected, template);
  };

  const startComposeToSelection = () => {
    const targets = selectedTargets();
    if (!targets.length) {
      setError(t('admin.needRecipients'));
      return;
    }
    setError(null);
    setPickDraftOpen(true);
  };

  const sendMail = async () => {
    if (!mailTarget?.length || !user) return;
    try {
      const url = buildAdminUserMailto({
        toEmail: mailTarget.map((p) => p.email),
        subject: mailSubject,
        message: mailBody,
        adminName: user.displayName,
      });
      await Linking.openURL(url);
      setMailTarget(null);
    } catch (e) {
      setError(toUserError(e));
    }
  };

  const saveUserRoles = async () => {
    if (!rolesEditor) return;
    setBusyId(rolesEditor.id);
    setError(null);
    try {
      const updated = await marketplace.adminUpdateUser(rolesEditor.id, {
        roles: draftRoles.length ? draftRoles : ['user'],
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setRolesEditor(null);
      await refresh();
    } catch (e) {
      setError(toUserError(e));
    } finally {
      setBusyId(null);
    }
  };

  const saveRole = async () => {
    if (!roleForm) return;
    setBusyId(roleForm.id || 'new-role');
    setError(null);
    try {
      await marketplace.upsertRole({
        id: roleForm.id,
        label: roleForm.label,
        description: roleForm.description,
        entitlements: filterKnownEntitlements(roleForm.entitlements),
      });
      setRoles(await marketplace.listRoles());
      setRoleForm(null);
      await refresh();
    } catch (e) {
      setError(toUserError(e));
    } finally {
      setBusyId(null);
    }
  };

  const saveAd = async () => {
    if (!adForm) return;
    setBusyId(adForm.id ?? 'new-ad');
    setError(null);
    try {
      await marketplace.upsertMarketingAd(adForm);
      setAds(await marketplace.listMarketingAds());
      setAdForm(null);
    } catch (e) {
      setError(toUserError(e));
    } finally {
      setBusyId(null);
    }
  };

  const applyPending = async () => {
    if (!pending) return;
    setBusyId(
      pending.type === 'deactivate'
        ? pending.user.id
        : pending.type === 'deleteRole'
          ? pending.role.id
          : pending.ad.id,
    );
    setError(null);
    try {
      if (pending.type === 'deactivate') {
        const updated = await marketplace.adminUpdateUser(pending.user.id, {
          deactivated: pending.deactivated,
        });
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        if (canSeeAnalytics) setAnalytics(await marketplace.adminGetAnalytics());
      } else if (pending.type === 'deleteRole') {
        await marketplace.deleteRole(pending.role.id);
        setRoles(await marketplace.listRoles());
        await refresh();
      } else {
        await marketplace.deleteMarketingAd(pending.ad.id);
        setAds(await marketplace.listMarketingAds());
      }
      setPending(null);
    } catch (e) {
      setError(toUserError(e));
      setPending(null);
    } finally {
      setBusyId(null);
    }
  };

  const confirmCopy = (() => {
    if (!pending) return { title: '', message: '', confirm: '' };
    if (pending.type === 'deactivate') {
      return {
        title: pending.deactivated ? t('admin.deactivateTitle') : t('admin.reactivateTitle'),
        message: pending.deactivated
          ? t('admin.deactivateBody', { name: pending.user.displayName })
          : t('admin.reactivateBody', { name: pending.user.displayName }),
        confirm: pending.deactivated ? t('admin.deactivate') : t('admin.reactivate'),
      };
    }
    if (pending.type === 'deleteRole') {
      return {
        title: t('admin.deleteRoleTitle'),
        message: t('admin.deleteRoleBody', { id: pending.role.id }),
        confirm: t('admin.deleteRole'),
      };
    }
    return {
      title: t('admin.deleteAdTitle'),
      message: t('admin.deleteAdBody', { title: pending.ad.title }),
      confirm: t('admin.deleteAd'),
    };
  })();

  const roleOptions = roles.length ? roles : getRoleDefinitions();

  const header = (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{t('admin.eyebrow')}</Text>
      <Text style={styles.title}>{t('admin.title')}</Text>
      <Text style={styles.sub}>{t('admin.sub')}</Text>
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.segments}>
        {sections.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSection(s)}
            style={[styles.segment, activeSection === s && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, activeSection === s && styles.segmentTextActive]}>
              {s === 'users'
                ? t('admin.tabUsers')
                : s === 'roles'
                  ? t('admin.tabRoles')
                  : t('admin.tabMarketing')}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeSection === 'users' && canSeeAnalytics && analytics ? (
        <View style={styles.stats}>
          <Stat label={t('admin.statUsers')} value={String(analytics.usersTotal)} />
          <Stat label={t('admin.statActive')} value={String(analytics.usersActive)} />
          <Stat label={t('admin.statAdmins')} value={String(analytics.admins)} />
          <Stat label={t('admin.statListings')} value={String(analytics.listingsActive)} />
          <Stat label={t('admin.statConversations')} value={String(analytics.conversations)} />
          <Stat label={t('admin.statDeactivated')} value={String(analytics.usersDeactivated)} />
        </View>
      ) : null}

      {activeSection === 'users' ? (
        <>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('admin.searchPlaceholder')}
            placeholderTextColor={colors.inkFaint}
            style={styles.search}
          />
          <Text style={styles.section}>{t('admin.usersSection')}</Text>
        </>
      ) : null}

      {activeSection === 'roles' ? (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.section}>{t('admin.rolesSection')}</Text>
          {canManageRoles ? (
            <Button
              label={t('admin.createRole')}
              compact
              onPress={() =>
                setRoleForm({
                  id: '',
                  label: '',
                  description: '',
                  entitlements: ['app.access'],
                  editing: false,
                })
              }
            />
          ) : null}
        </View>
      ) : null}

      {activeSection === 'marketing' ? (
        <View style={{ gap: spacing.md }}>
          <Text style={styles.section}>{t('admin.marketingEmailSection')}</Text>
          <Text style={styles.hint}>{t('admin.marketingEmailHint')}</Text>
          {canOutreach && canReadUsers ? (
            <>
              <TextInput
                value={recipientQuery}
                onChangeText={setRecipientQuery}
                placeholder={t('admin.recipientSearchPlaceholder')}
                placeholderTextColor={colors.inkFaint}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.search}
              />
              <Text style={styles.meta}>
                {t('admin.recipientsSelected', {
                  selected: String(selectedMailIds.size),
                  shown: String(filteredRecipients.length),
                })}
              </Text>
              <View style={styles.cardActions}>
                <Button
                  label={t('admin.selectMatching', { count: String(filteredRecipients.length) })}
                  variant="ghost"
                  compact
                  disabled={!filteredRecipients.length}
                  onPress={() =>
                    setSelectedMailIds((prev) => {
                      const next = new Set(prev);
                      for (const u of filteredRecipients) next.add(u.id);
                      return next;
                    })
                  }
                  style={styles.action}
                />
                <Button
                  label={t('admin.clearRecipients')}
                  variant="ghost"
                  compact
                  disabled={!selectedMailIds.size}
                  onPress={() => setSelectedMailIds(new Set())}
                  style={styles.action}
                />
                <Button
                  label={t('admin.composeSelected', { count: String(selectedMailIds.size) })}
                  compact
                  disabled={!selectedMailIds.size}
                  onPress={startComposeToSelection}
                  style={styles.action}
                />
              </View>
              <View style={{ gap: spacing.sm, maxHeight: 220 }}>
                <ScrollView nestedScrollEnabled>
                  {!filteredRecipients.length ? (
                    <Text style={styles.empty}>{t('admin.noRecipientsMatch')}</Text>
                  ) : (
                    filteredRecipients.map((profile) => {
                      const on = selectedMailIds.has(profile.id);
                      return (
                        <Pressable
                          key={profile.id}
                          style={[styles.recipientRow, on && styles.recipientRowOn]}
                          onPress={() =>
                            setSelectedMailIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(profile.id)) next.delete(profile.id);
                              else next.add(profile.id);
                              return next;
                            })
                          }
                        >
                          <View style={[styles.check, on && styles.checkOn]}>
                            <Text style={styles.checkText}>{on ? '✓' : ''}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{profile.displayName}</Text>
                            <Text style={styles.meta}>{profile.email}</Text>
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </>
          ) : (
            <Text style={styles.hint}>{t('admin.outreachNeedsUsersRead')}</Text>
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.section}>{t('admin.marketingAdsSection')}</Text>
            {canMarketingAds ? (
              <Button
                label={t('admin.createAd')}
                compact
                onPress={() =>
                  setAdForm({
                    title: t('admin.emailSubjectDefault'),
                    body: t('admin.emailBodyDefault'),
                    active: true,
                  })
                }
              />
            ) : null}
          </View>
          <Text style={styles.hint}>{t('admin.marketingTemplatesHint')}</Text>
        </View>
      ) : null}

      {loading ? <ActivityIndicator color={colors.brand} style={{ marginVertical: 12 }} /> : null}
    </View>
  );

  const listData =
    activeSection === 'users'
      ? filteredUsers
      : activeSection === 'roles'
        ? roleOptions
        : ads;

  return (
    <View style={styles.root}>
      <FlatList
        data={listData as Array<Profile | RoleDefinition | MarketingAd>}
        key={`${locale}-${activeSection}`}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingHorizontal: contentPad },
          isDesktop && { maxWidth: layout.contentMax, alignSelf: 'center', width: '100%' },
        ]}
        ListHeaderComponent={header}
        ListEmptyComponent={
          !loading && activeSection !== 'marketing' ? (
            <Text style={styles.empty}>
              {activeSection === 'users' ? t('admin.noUsers') : t('admin.noRoles')}
            </Text>
          ) : !loading && activeSection === 'marketing' && !ads.length ? (
            <Text style={styles.empty}>{t('admin.noAds')}</Text>
          ) : (
            <View />
          )
        }
        ListFooterComponent={undefined}
        renderItem={({ item }) => {
          if (activeSection === 'users') {
            const profile = item as Profile;
            const self = profile.id === user.id;
            const busy = busyId === profile.id;
            const itemEntitlements = resolveEntitlements(profile.roles);
            const hasAdminPanel = hasEntitlement(profile, 'admin.panel');
            return (
              <View style={[styles.card, profile.deactivatedAt ? styles.cardMuted : null]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.name}>
                      {profile.displayName}
                      {self ? ` (${t('admin.you')})` : ''}
                    </Text>
                    <Text style={styles.meta}>{profile.email}</Text>
                    <Text style={styles.meta}>
                      {profile.roles.join(', ')}
                      {hasAdminPanel ? ` · ${t('admin.roleAdmin')}` : ''}
                      {profile.deactivatedAt
                        ? ` · ${t('admin.statusDeactivated')}`
                        : ` · ${t('admin.statusActive')}`}
                    </Text>
                    <Text style={styles.entitlements} numberOfLines={2}>
                      {itemEntitlements.join(' · ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  {canOutreach ? (
                    <Button
                      label={t('admin.emailUser')}
                      variant="secondary"
                      compact
                      onPress={() => openMail([profile])}
                      disabled={busy || !profile.email}
                      style={styles.action}
                    />
                  ) : null}
                  {canManageUsers && !self ? (
                    <Button
                      label={t('admin.editRoles')}
                      variant="ghost"
                      compact
                      onPress={() => {
                        setRolesEditor(profile);
                        setDraftRoles([...profile.roles]);
                      }}
                      disabled={busy}
                      style={styles.action}
                    />
                  ) : null}
                  {canManageUsers && !self ? (
                    <Button
                      label={profile.deactivatedAt ? t('admin.reactivate') : t('admin.deactivate')}
                      variant={profile.deactivatedAt ? 'secondary' : 'danger'}
                      compact
                      onPress={() =>
                        setPending({
                          type: 'deactivate',
                          user: profile,
                          deactivated: !profile.deactivatedAt,
                        })
                      }
                      disabled={busy}
                      style={styles.action}
                    />
                  ) : null}
                </View>
              </View>
            );
          }

          if (activeSection === 'roles') {
            const role = item as RoleDefinition;
            return (
              <View style={styles.card}>
                <Text style={styles.name}>
                  {role.label}{' '}
                  <Text style={styles.meta}>({role.id})</Text>
                  {role.system ? ` · ${t('admin.systemRole')}` : ''}
                </Text>
                {role.description ? <Text style={styles.meta}>{role.description}</Text> : null}
                <Text style={styles.entitlements} numberOfLines={3}>
                  {role.entitlements.join(' · ') || t('admin.noEntitlements')}
                </Text>
                {canManageRoles ? (
                  <View style={styles.cardActions}>
                    <Button
                      label={t('admin.editRole')}
                      variant="secondary"
                      compact
                      onPress={() =>
                        setRoleForm({
                          id: role.id,
                          label: role.label,
                          description: role.description,
                          entitlements: [...role.entitlements],
                          editing: true,
                        })
                      }
                      style={styles.action}
                    />
                    {!role.system ? (
                      <Button
                        label={t('admin.deleteRole')}
                        variant="danger"
                        compact
                        onPress={() => setPending({ type: 'deleteRole', role })}
                        style={styles.action}
                      />
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          }

          const ad = item as MarketingAd;
          return (
            <View style={[styles.card, !ad.active ? styles.cardMuted : null]}>
              <Text style={styles.name}>{ad.title}</Text>
              <Text style={styles.meta}>
                {ad.active ? t('admin.adActive') : t('admin.adInactive')}
              </Text>
              <Text style={styles.entitlements} numberOfLines={4}>
                {ad.body || '—'}
              </Text>
              <View style={styles.cardActions}>
                {canOutreach ? (
                  <Button
                    label={t('admin.useTemplate')}
                    compact
                    onPress={() => openMailFromTemplate(ad)}
                    style={styles.action}
                  />
                ) : null}
                {canMarketingAds ? (
                  <>
                    <Button
                      label={t('admin.editAd')}
                      variant="secondary"
                      compact
                      onPress={() =>
                        setAdForm({
                          id: ad.id,
                          title: ad.title,
                          body: ad.body,
                          active: ad.active,
                        })
                      }
                      style={styles.action}
                    />
                    <Button
                      label={t('admin.deleteAd')}
                      variant="danger"
                      compact
                      onPress={() => setPending({ type: 'deleteAd', ad })}
                      style={styles.action}
                    />
                  </>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      <ConfirmDialog
        visible={Boolean(pending)}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={busyId ? t('common.loading') : confirmCopy.confirm}
        cancelLabel={t('common.cancel')}
        destructive={
          pending?.type === 'deactivate'
            ? pending.deactivated
            : pending?.type === 'deleteRole' || pending?.type === 'deleteAd'
        }
        onCancel={() => setPending(null)}
        onConfirm={() => void applyPending()}
      />

      <Modal visible={Boolean(rolesEditor)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('admin.editRolesTitle')}</Text>
            <Text style={styles.meta}>{rolesEditor?.displayName}</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {roleOptions.map((role) => {
                const on = draftRoles.includes(role.id);
                return (
                  <Pressable
                    key={role.id}
                    style={styles.checkboxRow}
                    onPress={() =>
                      setDraftRoles((prev) =>
                        on ? prev.filter((r) => r !== role.id) : [...prev, role.id],
                      )
                    }
                  >
                    <View style={[styles.check, on && styles.checkOn]}>
                      <Text style={styles.checkText}>{on ? '✓' : ''}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{role.label}</Text>
                      <Text style={styles.meta}>{role.id}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <Button label={t('common.cancel')} variant="ghost" onPress={() => setRolesEditor(null)} />
              <Button
                label={busyId ? t('common.loading') : t('common.save')}
                onPress={() => void saveUserRoles()}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={pickDraftOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <Text style={styles.modalTitle}>{t('admin.pickDraftTitle')}</Text>
            <Text style={styles.hint}>
              {t('admin.pickDraftHint', { count: String(selectedMailIds.size) })}
            </Text>
            <ScrollView style={{ maxHeight: 360 }}>
              <Pressable
                style={styles.card}
                onPress={() => openMail(selectedTargets(), null)}
              >
                <Text style={styles.name}>{t('admin.composeBlank')}</Text>
                <Text style={styles.meta}>{t('admin.composeBlankHint')}</Text>
              </Pressable>
              {ads.filter((a) => a.active).map((draft) => (
                <Pressable
                  key={draft.id}
                  style={styles.card}
                  onPress={() => openMail(selectedTargets(), draft)}
                >
                  <Text style={styles.name}>{draft.title}</Text>
                  <Text style={styles.entitlements} numberOfLines={3}>
                    {draft.body || '—'}
                  </Text>
                </Pressable>
              ))}
              {!ads.filter((a) => a.active).length ? (
                <Text style={styles.empty}>{t('admin.noAds')}</Text>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setPickDraftOpen(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(mailTarget)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('admin.composeEmail')}</Text>
            <Text style={styles.meta}>
              {mailTarget?.map((p) => p.email).join(', ')}
            </Text>
            <TextInput
              value={mailSubject}
              onChangeText={setMailSubject}
              placeholder={t('admin.emailSubject')}
              placeholderTextColor={colors.inkFaint}
              style={styles.search}
            />
            <TextInput
              value={mailBody}
              onChangeText={setMailBody}
              placeholder={t('admin.emailBody')}
              placeholderTextColor={colors.inkFaint}
              style={[styles.search, styles.multiline]}
              multiline
            />
            <Text style={styles.hint}>{t('admin.mailtoHint')}</Text>
            <View style={styles.modalActions}>
              <Button label={t('common.cancel')} variant="ghost" onPress={() => setMailTarget(null)} />
              <Button label={t('admin.openMail')} onPress={() => void sendMail()} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(roleForm)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>
              {roleForm?.editing ? t('admin.editRole') : t('admin.createRole')}
            </Text>
            <ScrollView>
              {!roleForm?.editing ? (
                <TextInput
                  value={roleForm?.id ?? ''}
                  onChangeText={(id) => setRoleForm((f) => (f ? { ...f, id } : f))}
                  placeholder={t('admin.roleIdPlaceholder')}
                  autoCapitalize="none"
                  placeholderTextColor={colors.inkFaint}
                  style={styles.search}
                />
              ) : (
                <Text style={styles.meta}>{roleForm?.id}</Text>
              )}
              <TextInput
                value={roleForm?.label ?? ''}
                onChangeText={(label) => setRoleForm((f) => (f ? { ...f, label } : f))}
                placeholder={t('admin.roleLabelPlaceholder')}
                placeholderTextColor={colors.inkFaint}
                style={styles.search}
              />
              <TextInput
                value={roleForm?.description ?? ''}
                onChangeText={(description) =>
                  setRoleForm((f) => (f ? { ...f, description } : f))
                }
                placeholder={t('admin.roleDescriptionPlaceholder')}
                placeholderTextColor={colors.inkFaint}
                style={styles.search}
              />
              <Text style={styles.section}>{t('admin.entitlementsSection')}</Text>
              {ENTITLEMENT_GROUPS.map((group) => (
                <View key={group.id} style={{ marginBottom: spacing.md }}>
                  <Text style={styles.groupLabel}>
                    {group.id === 'app'
                      ? t('admin.entGroupApp')
                      : group.id === 'admin'
                        ? t('admin.entGroupAdmin')
                        : t('admin.entGroupMarketing')}
                  </Text>
                  {group.entitlements.map((ent) => {
                    const on = roleForm?.entitlements.includes(ent) ?? false;
                    return (
                      <Pressable
                        key={ent}
                        style={styles.checkboxRow}
                        onPress={() =>
                          setRoleForm((f) => {
                            if (!f) return f;
                            const entitlements = on
                              ? f.entitlements.filter((e) => e !== ent)
                              : [...f.entitlements, ent];
                            return { ...f, entitlements };
                          })
                        }
                      >
                        <View style={[styles.check, on && styles.checkOn]}>
                          <Text style={styles.checkText}>{on ? '✓' : ''}</Text>
                        </View>
                        <Text style={styles.meta}>{ent}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Button label={t('common.cancel')} variant="ghost" onPress={() => setRoleForm(null)} />
              <Button
                label={busyId ? t('common.loading') : t('common.save')}
                onPress={() => void saveRole()}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(adForm)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {adForm?.id ? t('admin.editAd') : t('admin.createAd')}
            </Text>
            <Text style={styles.hint}>{t('admin.templateFormHint')}</Text>
            <TextInput
              value={adForm?.title ?? ''}
              onChangeText={(title) => setAdForm((f) => (f ? { ...f, title } : f))}
              placeholder={t('admin.adTitlePlaceholder')}
              placeholderTextColor={colors.inkFaint}
              style={styles.search}
            />
            <TextInput
              value={adForm?.body ?? ''}
              onChangeText={(body) => setAdForm((f) => (f ? { ...f, body } : f))}
              placeholder={t('admin.adBodyPlaceholder')}
              placeholderTextColor={colors.inkFaint}
              style={[styles.search, styles.multiline]}
              multiline
            />
            <View style={styles.switchRow}>
              <Text style={styles.meta}>{t('admin.adActive')}</Text>
              <Switch
                value={adForm?.active ?? true}
                onValueChange={(active) => setAdForm((f) => (f ? { ...f, active } : f))}
              />
            </View>
            <View style={styles.modalActions}>
              <Button label={t('common.cancel')} variant="ghost" onPress={() => setAdForm(null)} />
              <Button
                label={busyId ? t('common.loading') : t('common.save')}
                onPress={() => void saveAd()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  list: { paddingVertical: spacing.xl, gap: spacing.md, paddingBottom: 48 },
  header: { gap: spacing.sm, marginBottom: spacing.md },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    color: colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.ink },
  sub: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted, lineHeight: 22 },
  section: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.ink,
    marginTop: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  segments: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segmentActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  segmentText: { fontFamily: fonts.sansMedium, color: colors.inkMuted, fontSize: 13 },
  segmentTextActive: { color: colors.brandDark, fontFamily: fonts.sansBold },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  stat: {
    minWidth: 100,
    flexGrow: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  statValue: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.ink },
  statLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  search: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.sans,
    color: colors.ink,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  empty: { fontFamily: fonts.sans, color: colors.inkMuted, marginTop: spacing.md },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardMuted: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  name: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted },
  entitlements: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint, lineHeight: 18 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  action: { flexGrow: 1, minWidth: 110 },
  check: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  checkOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  checkText: { fontFamily: fonts.sansBold, color: colors.brandDark },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    marginBottom: spacing.xs,
  },
  recipientRowOn: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  groupLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  hint: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  modalTitle: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
