import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { useQaStore } from '../state/qa';

/**
 * Renders a thin red banner across the top of the app when QA forces
 * offline mode. We don't ship NetInfo (avoids another native pod), so
 * "offline" is QA-driven via the debug menu / scenario apply — but the
 * UX surface is identical to a real offline indicator.
 */
export function OfflineBanner() {
  const offline = useQaStore((s) => s.forceError === 'offline');
  if (!offline) return null;
  return (
    <View testID={testIds.app.offlineBanner} style={styles.banner}>
      <Ionicons name="cloud-offline" size={16} color={theme.colors.primaryText} />
      <Text style={styles.text}>You&apos;re offline. Some features won&apos;t work.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.danger,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  text: {
    color: theme.colors.primaryText,
    fontSize: theme.typography.caption,
    fontWeight: '600',
  },
});
