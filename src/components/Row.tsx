import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

type Props = {
  label: string;
  value?: string;
  trailing?: ReactNode;
  children?: ReactNode;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  icon?: IoniconName;
};

export function Row({
  label,
  value,
  trailing,
  children,
  onPress,
  testID,
  accessibilityLabel,
  icon,
}: Props) {
  const top = (
    <View style={styles.top}>
      {icon ? (
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color={theme.colors.text} />
        </View>
      ) : null}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {value != null && (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      )}
      {onPress && !trailing ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.muted}
          style={styles.chevron}
        />
      ) : null}
      {trailing}
    </View>
  );

  const content = (
    <>
      {top}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View testID={testID} accessibilityLabel={accessibilityLabel ?? label} style={styles.row}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  pressed: { backgroundColor: theme.colors.background },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    gap: theme.spacing.sm,
  },
  iconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: theme.typography.body, color: theme.colors.text },
  value: { fontSize: theme.typography.body, color: theme.colors.muted },
  chevron: { marginLeft: theme.spacing.xs },
});
