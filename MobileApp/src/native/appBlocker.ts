import { NativeModules, Platform } from 'react-native';

export type AppRule = {
  enabled: boolean;
  mode: 'always' | 'limit' | 'schedule';
  limitMinutes: number;
  startMinutes: number;
  endMinutes: number;
};

export type InstalledApp = {
  packageName: string;
  label: string;
  icon?: string;
};

type AppBlockerNativeModule = {
  setBlocking: (enabled: boolean, packages: string[]) => Promise<void>;
  setAppRule: (
    packageName: string,
    enabled: boolean,
    mode: string,
    limitMinutes: number,
    startMinutes: number,
    endMinutes: number,
  ) => Promise<void>;
  removeAppRule: (packageName: string) => Promise<void>;
  getAppRules: () => Promise<Record<string, AppRule>>;
  getInstalledApps: () => Promise<InstalledApp[]>;
  getUsageForDate: (date: string) => Promise<Record<string, number>>;
  isAccessibilityServiceEnabled: () => Promise<boolean>;
  requestAccessibilityService: () => Promise<void>;
  hasUsageAccess: () => Promise<boolean>;
  requestUsageAccess: () => Promise<void>;
};

const nativeModule = NativeModules.AppBlockerModule as AppBlockerNativeModule | undefined;

export const isAppBlockerSupported = Platform.OS === 'android' && Boolean(nativeModule);

async function requireModule(): Promise<AppBlockerNativeModule> {
  if (!nativeModule) {
    throw new Error('App blocking is only available on Android.');
  }
  return nativeModule;
}

export async function setBlocking(enabled: boolean, packages: string[]) {
  const module = await requireModule();
  await module.setBlocking(enabled, packages);
}

export async function setAppRule(
  packageName: string,
  enabled: boolean,
  mode: AppRule['mode'] = 'always',
  limitMinutes = 0,
  startMinutes = 0,
  endMinutes = 0,
) {
  const module = await requireModule();
  await module.setAppRule(packageName, enabled, mode, limitMinutes, startMinutes, endMinutes);
}

export async function removeAppRule(packageName: string) {
  const module = await requireModule();
  await module.removeAppRule(packageName);
}

export async function getAppRules() {
  const module = await requireModule();
  return module.getAppRules();
}

export async function getInstalledApps() {
  const module = await requireModule();
  return module.getInstalledApps();
}

export async function getUsageForDate(date: string) {
  const module = await requireModule();
  return module.getUsageForDate(date);
}

export async function isAccessibilityServiceEnabled() {
  if (!nativeModule) {
    return false;
  }
  return nativeModule.isAccessibilityServiceEnabled();
}

export async function requestAccessibilityService() {
  const module = await requireModule();
  await module.requestAccessibilityService();
}

export async function hasUsageAccess() {
  if (!nativeModule) {
    return false;
  }
  return nativeModule.hasUsageAccess();
}

export async function requestUsageAccess() {
  const module = await requireModule();
  await module.requestUsageAccess();
}

export async function syncFocusBlocking(enabled: boolean, packages: string[]) {
  if (!isAppBlockerSupported) {
    return;
  }

  if (!enabled) {
    await setBlocking(false, packages);
    await Promise.all(packages.map(packageName => removeAppRule(packageName)));
    return;
  }

  await setBlocking(true, packages);
  await Promise.all(
    packages.map(packageName => setAppRule(packageName, true, 'always', 0, 0, 0)),
  );
}
