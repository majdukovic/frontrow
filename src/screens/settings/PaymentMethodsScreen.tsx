import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { testIds } from '../../testIds';
import { Button } from '../../components/Button';
import {
  usePaymentMethods,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
} from '../../hooks/usePaymentMethods';
import { showToast } from '../../state/toasts';
import type { ProfileStackParamList } from '../../navigation/types';
import type { CardBrand, PaymentMethod } from '../../api/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

const BRAND_ICON: Record<CardBrand, IoniconName> = {
  visa: 'card',
  mastercard: 'card',
  amex: 'card',
  discover: 'card',
  unknown: 'card-outline',
};

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  unknown: 'Card',
};

export function PaymentMethodsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { data, isLoading, error } = usePaymentMethods();
  const remove = useDeletePaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();

  if (isLoading) {
    return (
      <View style={styles.center} testID={testIds.paymentMethods.screen}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center} testID={testIds.paymentMethods.screen}>
        <Text style={styles.error}>Failed to load payment methods.</Text>
      </View>
    );
  }

  const onDelete = (pm: PaymentMethod) => {
    Alert.alert('Delete card?', `Visa •••• ${pm.last4} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(pm.id);
            showToast('Card removed', 'success');
          } catch (e) {
            showToast((e as Error).message, 'error');
          }
        },
      },
    ]);
  };

  const onSetDefault = async (pm: PaymentMethod) => {
    try {
      await setDefault.mutateAsync(pm.id);
      showToast('Default card updated', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  return (
    <View style={styles.container} testID={testIds.paymentMethods.screen}>
      <FlatList
        testID={testIds.paymentMethods.list}
        data={data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View testID={testIds.paymentMethods.item(item.id)} style={styles.card}>
            <View style={styles.cardTop}>
              <Ionicons name={BRAND_ICON[item.brand]} size={28} color={theme.colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {BRAND_LABEL[item.brand]} •••• {item.last4}
                </Text>
                <Text style={styles.cardMeta}>
                  Exp {String(item.expMonth).padStart(2, '0')}/{String(item.expYear).slice(-2)} ·{' '}
                  {item.cardholder}
                </Text>
              </View>
              {item.isDefault ? (
                <View testID={testIds.paymentMethods.defaultBadge(item.id)} style={styles.badge}>
                  <Text style={styles.badgeText}>Default</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardActions}>
              {!item.isDefault ? (
                <Pressable
                  testID={testIds.paymentMethods.setDefaultButton(item.id)}
                  onPress={() => void onSetDefault(item)}
                  hitSlop={8}
                >
                  <Text style={styles.actionText}>Set default</Text>
                </Pressable>
              ) : null}
              <Pressable
                testID={testIds.paymentMethods.deleteButton(item.id)}
                onPress={() => onDelete(item)}
                hitSlop={8}
              >
                <Text style={[styles.actionText, styles.danger]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center} testID={testIds.paymentMethods.emptyState}>
            <Text style={styles.muted}>No payment methods yet.</Text>
          </View>
        }
      />
      <View style={styles.footer}>
        <Button
          testID={testIds.paymentMethods.addButton}
          title="Add card"
          onPress={() => nav.navigate('AddPaymentMethod')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: theme.spacing.md, gap: theme.spacing.md },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  cardTitle: { fontSize: theme.typography.body, fontWeight: '600', color: theme.colors.text },
  cardMeta: { fontSize: theme.typography.caption, color: theme.colors.muted, marginTop: 2 },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  badgeText: { color: theme.colors.primaryText, fontSize: theme.typography.caption, fontWeight: '600' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  actionText: { color: theme.colors.primary, fontSize: theme.typography.body, fontWeight: '500' },
  danger: { color: theme.colors.danger },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  muted: { color: theme.colors.muted, fontSize: theme.typography.body, textAlign: 'center' },
  error: { color: theme.colors.danger, fontSize: theme.typography.body },
});
