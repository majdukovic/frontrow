import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type BuildInfo = {
  appName: string;
  version: string;
  buildNumber: string;
  platform: 'ios' | 'android' | 'web' | 'macos' | 'windows';
  osVersion: string;
  expoSdk: string;
  env: 'development' | 'production';
};

export function getBuildInfo(): BuildInfo {
  const expoConfig = Constants.expoConfig;
  const ios = expoConfig?.ios;
  const android = expoConfig?.android;
  const buildNumber =
    Platform.OS === 'ios'
      ? (ios?.buildNumber ?? '—')
      : Platform.OS === 'android'
        ? String(android?.versionCode ?? '—')
        : '—';
  return {
    appName: expoConfig?.name ?? 'FrontRow',
    version: expoConfig?.version ?? '0.0.0',
    buildNumber,
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    expoSdk: expoConfig?.sdkVersion ?? Constants.expoVersion ?? 'unknown',
    env: __DEV__ ? 'development' : 'production',
  };
}
