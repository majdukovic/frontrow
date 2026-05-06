import { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { Button } from '../components/Button';
import { useEvent } from '../hooks/useEvents';
import { useApplyPromoCode, usePurchaseTicket } from '../hooks/useTickets';
import { useAuthStore } from '../state/auth';
import { formatPrice } from '../utils/format';
import type { EventsStackParamList } from '../navigation/types';
import type { PromoCodeResult } from '../api/services/tickets';

type Props = NativeStackScreenProps<EventsStackParamList, 'BuyTicket'>;

export function BuyTicketScreen({ route }: Props) {
  const { eventId } = route.params;
  const nav = useNavigation();
  const { data: event } = useEvent(eventId);
  const { mutateAsync, isPending } = usePurchaseTicket();
  const { mutateAsync: applyPromo, isPending: isApplyingPromo } = useApplyPromoCode();
  const token = useAuthStore((s) => s.token);
  const [qty, setQty] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<PromoCodeResult | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!event) return null;

  const subtotal = event.priceCents * qty;
  const discount = promo ? promo.discountCents * qty : 0;
  const totalCents = Math.max(0, subtotal - discount);

  const onApplyPromo = async () => {
    setPromoError(null);
    try {
      const result = await applyPromo({ eventId: event.id, code: promoCode });
      setPromo(result);
    } catch (e) {
      setPromo(null);
      setPromoError((e as Error).message);
    }
  };

  const onClearPromo = () => {
    setPromo(null);
    setPromoCode('');
    setPromoError(null);
  };

  const onPay = async () => {
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to purchase tickets.');
      return;
    }
    try {
      await mutateAsync({ eventId: event.id, quantity: qty });
      nav.goBack();
      Alert.alert('Success', 'Ticket purchased.');
    } catch (e) {
      Alert.alert('Purchase failed', (e as Error).message);
    }
  };

  return (
    <View style={styles.container} testID={testIds.buyTicket.screen}>
      <Text style={styles.heading}>{event.title}</Text>
      <View testID={testIds.buyTicket.quantityStepper} style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
          onPress={() => setQty((q) => Math.max(1, q - 1))}
          style={styles.stepBtn}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.qty} accessibilityLabel={`Quantity ${qty}`}>
          {qty}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
          onPress={() => setQty((q) => Math.min(10, q + 1))}
          style={styles.stepBtn}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.promoBlock}>
        <Text style={styles.label}>Promo code</Text>
        {promo ? (
          <View style={styles.promoApplied}>
            <Text testID={testIds.buyTicket.promoSuccess} style={styles.promoSuccess}>
              {promo.code} — {promo.percentOff}% off
            </Text>
            <Pressable accessibilityRole="button" onPress={onClearPromo}>
              <Text style={styles.promoRemove}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.promoRow}>
            <TextInput
              testID={testIds.buyTicket.promoInput}
              accessibilityLabel="Promo code"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="e.g. FRONTROW10"
              style={styles.promoInput}
            />
            <Button
              testID={testIds.buyTicket.promoApplyButton}
              title="Apply"
              variant="secondary"
              onPress={() => void onApplyPromo()}
              loading={isApplyingPromo}
              disabled={promoCode.trim().length === 0}
            />
          </View>
        )}
        {promoError && (
          <Text testID={testIds.buyTicket.promoError} style={styles.errorText}>
            {promoError}
          </Text>
        )}
      </View>

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatPrice(subtotal, event.currency)}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={[styles.totalValue, { color: theme.colors.success }]}>
              −{formatPrice(discount, event.currency)}
            </Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabelStrong}>Total</Text>
          <Text testID={testIds.buyTicket.totalAmount} style={styles.totalValueStrong}>
            {formatPrice(totalCents, event.currency)}
          </Text>
        </View>
      </View>

      <Button
        testID={testIds.buyTicket.payButton}
        title={isPending ? 'Processing…' : 'Confirm purchase'}
        onPress={onPay}
        loading={isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  heading: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: theme.typography.title, color: theme.colors.text },
  qty: {
    fontSize: theme.typography.heading,
    color: theme.colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  promoBlock: { gap: theme.spacing.xs },
  label: { fontSize: theme.typography.caption, color: theme.colors.muted },
  promoRow: { flexDirection: 'row', gap: theme.spacing.sm },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  promoApplied: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  promoSuccess: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.success,
  },
  promoRemove: { fontSize: theme.typography.body, color: theme.colors.primary },
  errorText: { fontSize: theme.typography.caption, color: theme.colors.danger },
  totals: { gap: theme.spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: theme.typography.body, color: theme.colors.muted },
  totalLabelStrong: {
    fontSize: theme.typography.title,
    fontWeight: '600',
    color: theme.colors.text,
  },
  totalValue: { fontSize: theme.typography.body, color: theme.colors.text },
  totalValueStrong: {
    fontSize: theme.typography.title,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
