import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { useToastsStore, type ToastKind } from '../state/toasts';

const KIND_COLOR: Record<ToastKind, string> = {
  info: theme.colors.text,
  success: theme.colors.success,
  error: theme.colors.danger,
};

const KIND_ICON: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  error: 'alert-circle',
};

export function ToastHost() {
  const toasts = useToastsStore((s) => s.toasts);
  const dismiss = useToastsStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={styles.host} testID="toast.host">
      {toasts.map((t) => (
        <Pressable
          key={t.id}
          testID={`toast.${t.kind}.${t.id}`}
          accessibilityRole="alert"
          accessibilityLabel={t.message}
          onPress={() => dismiss(t.id)}
          style={({ pressed }) => [styles.toast, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name={KIND_ICON[t.kind]} size={20} color={KIND_COLOR[t.kind]} />
          <Text testID="toast.message" style={[styles.message, { color: KIND_COLOR[t.kind] }]}>
            {t.message}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.md,
    right: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  message: { flex: 1, fontSize: theme.typography.body, fontWeight: '500' },
});
