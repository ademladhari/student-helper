import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { InstalledApp } from '../native/appBlocker';
import {
  getInstalledApps,
  hasUsageAccess,
  isAccessibilityServiceEnabled,
  isAppBlockerSupported,
  requestAccessibilityService,
  requestUsageAccess,
  syncFocusBlocking,
} from '../native/appBlocker';

const STORAGE_KEY = 'focus.blockedAppPackages';

export function useFocusBlockedApps() {
  const [blockedPackages, setBlockedPackages] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) {
          setBlockedPackages(parsed.filter(item => typeof item === 'string'));
        }
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  const saveBlockedPackages = useCallback(async (packages: string[]) => {
    setBlockedPackages(packages);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(packages)).catch(() => undefined);
  }, []);

  return {
    hydrated,
    blockedPackages,
    saveBlockedPackages,
  };
}

export async function ensureBlockingPermissions(): Promise<{
  accessibilityEnabled: boolean;
  usageEnabled: boolean;
}> {
  const accessibilityEnabled = await isAccessibilityServiceEnabled();
  const usageEnabled = await hasUsageAccess();
  return { accessibilityEnabled, usageEnabled };
}

export async function requestBlockingPermissions() {
  const status = await ensureBlockingPermissions();

  if (!status.accessibilityEnabled) {
    await requestAccessibilityService();
    return status;
  }

  if (!status.usageEnabled) {
    await requestUsageAccess();
  }

  return status;
}

export async function loadInstalledApps(): Promise<InstalledApp[]> {
  if (!isAppBlockerSupported) {
    return [];
  }
  return getInstalledApps();
}

export async function applyFocusBlocking(active: boolean, packages: string[]) {
  if (!isAppBlockerSupported) {
    return;
  }
  await syncFocusBlocking(active, packages);
}
