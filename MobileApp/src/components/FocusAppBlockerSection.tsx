import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  applyFocusBlocking,
  ensureBlockingPermissions,
  loadInstalledApps,
  requestBlockingPermissions,
} from '../hooks/useFocusAppBlocking';
import { isAppBlockerSupported, type InstalledApp } from '../native/appBlocker';
import { palette, radius, spacing } from '../theme/tokens';

type Props = {
  enabled: boolean;
  showPicker: boolean;
  blockedPackages: string[];
  isFocusPhaseActive: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onTogglePicker: (visible: boolean) => void;
  onSaveBlockedPackages: (packages: string[]) => void;
};

export default function FocusAppBlockerSection({
  enabled,
  showPicker,
  blockedPackages,
  isFocusPhaseActive,
  onToggleEnabled,
  onTogglePicker,
  onSaveBlockedPackages,
}: Props) {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>(blockedPackages);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingApps, setLoadingApps] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [usageEnabled, setUsageEnabled] = useState(false);

  useEffect(() => {
    setSelectedPackages(blockedPackages);
  }, [blockedPackages]);

  useEffect(() => {
    if (!isAppBlockerSupported) {
      return;
    }

    ensureBlockingPermissions().then(status => {
      setAccessibilityEnabled(status.accessibilityEnabled);
      setUsageEnabled(status.usageEnabled);
    });
  }, [showPicker, enabled]);

  const query = searchQuery.trim().toLowerCase();

  const filteredApps = useMemo(() => {
    if (!query) {
      return installedApps;
    }
    return installedApps.filter(
      app =>
        app.label.toLowerCase().includes(query) || app.packageName.toLowerCase().includes(query),
    );
  }, [installedApps, searchQuery]);

  const displayedApps = useMemo(() => {
    if (query) {
      return filteredApps;
    }
    return filteredApps.slice(0, 20);
  }, [filteredApps, query]);

  const hasMoreApps = !query && installedApps.length > 20;

  if (Platform.OS !== 'android' || !isAppBlockerSupported) {
    return null;
  }

  async function handleToggleEnabled() {
    const nextEnabled = !enabled;

    if (nextEnabled) {
      const status = await ensureBlockingPermissions();
      setAccessibilityEnabled(status.accessibilityEnabled);
      setUsageEnabled(status.usageEnabled);

      if (!status.accessibilityEnabled || !status.usageEnabled) {
        Alert.alert(
          'Permissions required',
          'Enable Accessibility and Usage Access for SmartStudy before app blocking can work.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open settings',
              onPress: () => {
                requestBlockingPermissions();
              },
            },
          ],
        );
        return;
      }

      if (blockedPackages.length === 0) {
        onTogglePicker(true);
        return;
      }
    }

    onToggleEnabled(nextEnabled);
    await applyFocusBlocking(nextEnabled && isFocusPhaseActive, nextEnabled ? blockedPackages : []);
  }

  async function openPicker() {
    setSearchQuery('');
    setLoadingApps(true);
    onTogglePicker(true);

    try {
      const apps = await loadInstalledApps();
      setInstalledApps(apps);
      setSelectedPackages(blockedPackages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load installed apps.';
      Alert.alert('App list error', message);
      onTogglePicker(false);
    } finally {
      setLoadingApps(false);
    }
  }

  async function savePicker() {
    if (selectedPackages.length === 0) {
      Alert.alert('Choose apps', 'Select at least one app to block during focus.');
      return;
    }

    onSaveBlockedPackages(selectedPackages);
    onTogglePicker(false);

    if (!enabled) {
      onToggleEnabled(true);
    }

    await applyFocusBlocking(isFocusPhaseActive, selectedPackages);
  }

  function togglePackage(packageName: string) {
    setSelectedPackages(current =>
      current.includes(packageName)
        ? current.filter(item => item !== packageName)
        : [...current, packageName],
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>App blocking</Text>
          <Text style={styles.subtitle}>
            Block distracting apps while your focus timer is running.
          </Text>
        </View>
        <Pressable
          style={[styles.toggleButton, enabled && styles.toggleButtonActive]}
          onPress={handleToggleEnabled}>
          <Text style={[styles.toggleText, enabled && styles.toggleTextActive]}>
            {enabled ? 'On' : 'Off'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.meta}>
        {blockedPackages.length} app{blockedPackages.length === 1 ? '' : 's'} selected
        {enabled && isFocusPhaseActive ? ' · blocking active' : ''}
      </Text>

      <View style={styles.permissionRow}>
        <Text style={accessibilityEnabled ? styles.permissionOk : styles.permissionMissing}>
          Accessibility {accessibilityEnabled ? 'enabled' : 'required'}
        </Text>
        <Text style={usageEnabled ? styles.permissionOk : styles.permissionMissing}>
          Usage access {usageEnabled ? 'enabled' : 'required'}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={openPicker}>
          <Text style={styles.secondaryButtonText}>Choose apps</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={requestBlockingPermissions}>
          <Text style={styles.secondaryButtonText}>Permissions</Text>
        </Pressable>
      </View>

      <Modal visible={showPicker} animationType="slide" onRequestClose={() => onTogglePicker(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apps to block</Text>
            <Pressable onPress={() => onTogglePicker(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search apps"
            placeholderTextColor={palette.textMuted}
            style={styles.searchInput}
          />

          {hasMoreApps ? (
            <Text style={styles.searchHint}>
              Showing 20 apps. Search to find more ({installedApps.length} installed).
            </Text>
          ) : null}

          {loadingApps ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.appList}>
              {displayedApps.length === 0 ? (
                <Text style={styles.emptySearch}>No apps match your search.</Text>
              ) : null}
              {displayedApps.map(app => {
                const selected = selectedPackages.includes(app.packageName);
                return (
                  <Pressable
                    key={app.packageName}
                    style={[styles.appRow, selected && styles.appRowSelected]}
                    onPress={() => togglePackage(app.packageName)}>
                    {app.icon ? (
                      <Image source={{ uri: app.icon }} style={styles.appIcon} />
                    ) : (
                      <View style={styles.appIconFallback} />
                    )}
                    <View style={styles.appInfo}>
                      <Text style={styles.appLabel}>{app.label}</Text>
                      <Text style={styles.appPackage} numberOfLines={1}>
                        {app.packageName}
                      </Text>
                    </View>
                    <Text style={styles.checkMark}>{selected ? '✓' : ''}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Pressable style={styles.primaryButton} onPress={savePicker}>
            <Text style={styles.primaryButtonText}>Save blocked apps</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: palette.textStrong,
    fontWeight: '700',
    fontSize: 15,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  toggleButton: {
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceSoft,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  toggleButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  toggleText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  meta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  permissionRow: {
    gap: 4,
  },
  permissionOk: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  permissionMissing: {
    color: palette.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  secondaryButtonText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: palette.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: palette.textStrong,
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    color: palette.primary,
    fontWeight: '700',
  },
  searchInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#F9FBFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    color: palette.textStrong,
    marginBottom: spacing.sm,
  },
  searchHint: {
    color: palette.textMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  emptySearch: {
    color: palette.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appList: {
    paddingBottom: spacing.md,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  appRowSelected: {
    backgroundColor: palette.primarySoft,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  appIconFallback: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: palette.surfaceMuted,
  },
  appInfo: {
    flex: 1,
    minWidth: 0,
  },
  appLabel: {
    color: palette.textStrong,
    fontWeight: '600',
    fontSize: 14,
  },
  appPackage: {
    color: palette.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  checkMark: {
    width: 20,
    color: palette.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
