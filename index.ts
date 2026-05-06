import { LogBox } from 'react-native';

// Suppress dev warnings before any module that might fire them gets imported.
// The LogBox banner otherwise occludes the bottom tab bar in tests, and the
// warnings we'd see (expo-av deprecation, etc.) aren't actionable for the
// training playground use case.
LogBox.ignoreAllLogs(true);

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
