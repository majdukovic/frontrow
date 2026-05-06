import { useRef, type ReactNode } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

const ACTION_WIDTH = 96;
const OPEN_AT = 48;

type Props = {
  children: ReactNode;
  actionLabel: string;
  actionTestID?: string;
  onAction: () => void;
};

/**
 * Lightweight swipe-to-reveal row built on PanResponder + Animated. No
 * native dependency, which keeps the prebuild graph clean — important
 * because every native dep we add ripples through the QA training
 * flows. Trade-off: the spring is less polished than a real
 * `react-native-gesture-handler` Swipeable, but it's adequate for
 * teaching gesture-aware test patterns:
 *
 *   maestro: { swipe: { direction: LEFT, from: { id: 'myTickets.item.<id>' } } }
 *   detox:   await element(by.id('myTickets.item.<id>')).swipe('left', 'fast');
 *
 * The action area underneath gets a stable testID so test harnesses
 * can tap it directly without simulating the swipe — useful for
 * unit-level coverage of the action handler.
 */
export function SwipeableRow({ children, actionLabel, actionTestID, onAction }: Props) {
  const tx = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        tx.setOffset(offset.current);
        tx.setValue(0);
      },
      onPanResponderMove: (_e, g) => {
        const next = Math.min(0, Math.max(-ACTION_WIDTH, g.dx));
        tx.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        tx.flattenOffset();
        const projected = offset.current + g.dx;
        const open = projected < -OPEN_AT;
        const target = open ? -ACTION_WIDTH : 0;
        offset.current = target;
        Animated.spring(tx, {
          toValue: target,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.wrapper}>
      <View style={styles.actionLayer} pointerEvents="box-none">
        <Pressable
          testID={actionTestID}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      </View>
      <Animated.View style={[styles.foreground, { transform: [{ translateX: tx }] }]} {...responder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  actionLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    alignItems: 'stretch',
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  foreground: {
    backgroundColor: 'transparent',
  },
});
