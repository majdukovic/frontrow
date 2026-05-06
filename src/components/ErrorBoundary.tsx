import { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { Button } from './Button';
import { track } from '../state/analytics';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render errors anywhere below it. Without this, a single failing
 * screen unmounts the navigator and the user sees a stuck red screen on
 * dev builds (or a silent crash on release). The fallback renders a
 * Reload button that resets state — for QA, this is also a deterministic
 * surface for the "trigger crash from debug" flow.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    track('errorBoundary.caught', { message: error.message });
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <View testID="app.errorBoundary" style={styles.root}>
        <Ionicons name="warning-outline" size={48} color={theme.colors.danger} />
        <Text style={styles.title} accessibilityRole="header">
          Something went wrong
        </Text>
        <Text style={styles.body} numberOfLines={3}>
          {this.state.error.message}
        </Text>
        <Button
          testID="app.errorBoundary.reload"
          title="Try again"
          onPress={() => this.setState({ error: null })}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  body: {
    fontSize: theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
