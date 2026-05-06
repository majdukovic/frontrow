import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

type Props = {
  icon: IoniconName;
  title: string;
  body?: string;
  testID?: string;
};

/**
 * Reusable centered empty/zero state. Every list and screen with a
 * "nothing here yet" surface should reach for this — it gives every
 * empty state the same Ionicon + heading + supporting copy treatment.
 */
export function EmptyState({ icon, title, body, testID }: Props) {
  return (
    <View testID={testID} style={styles.root}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={36} color={theme.colors.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: { fontSize: theme.typography.title, fontWeight: '700', color: theme.colors.text },
  body: {
    fontSize: theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
