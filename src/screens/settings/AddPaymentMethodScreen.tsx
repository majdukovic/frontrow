import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import { testIds } from '../../testIds';
import { Button } from '../../components/Button';
import { useAddPaymentMethod } from '../../hooks/usePaymentMethods';
import { showToast } from '../../state/toasts';

export function AddPaymentMethodScreen() {
  const nav = useNavigation();
  const [cardholder, setCardholder] = useState('');
  const [number, setNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = useAddPaymentMethod();

  const onSubmit = async () => {
    setError(null);
    try {
      await add.mutateAsync({
        cardholder,
        number,
        expMonth: Number(expMonth),
        expYear: Number(expYear),
        cvc,
      });
      showToast('Card added', 'success');
      nav.goBack();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testIds.addPaymentMethod.screen}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Cardholder name</Text>
      <TextInput
        testID={testIds.addPaymentMethod.cardholderInput}
        accessibilityLabel="Cardholder name"
        value={cardholder}
        onChangeText={setCardholder}
        placeholder="Jane Doe"
        autoCapitalize="words"
        style={styles.input}
      />

      <Text style={styles.label}>Card number</Text>
      <TextInput
        testID={testIds.addPaymentMethod.numberInput}
        accessibilityLabel="Card number"
        value={number}
        onChangeText={(v) => setNumber(v.replace(/[^\d]/g, ''))}
        placeholder="4242 4242 4242 4242"
        keyboardType="number-pad"
        maxLength={19}
        style={styles.input}
      />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Exp month</Text>
          <TextInput
            testID={testIds.addPaymentMethod.expMonthInput}
            accessibilityLabel="Expiration month"
            value={expMonth}
            onChangeText={(v) => setExpMonth(v.replace(/[^\d]/g, '').slice(0, 2))}
            placeholder="MM"
            keyboardType="number-pad"
            maxLength={2}
            style={styles.input}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Exp year</Text>
          <TextInput
            testID={testIds.addPaymentMethod.expYearInput}
            accessibilityLabel="Expiration year"
            value={expYear}
            onChangeText={(v) => setExpYear(v.replace(/[^\d]/g, '').slice(0, 4))}
            placeholder="YYYY"
            keyboardType="number-pad"
            maxLength={4}
            style={styles.input}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>CVC</Text>
          <TextInput
            testID={testIds.addPaymentMethod.cvcInput}
            accessibilityLabel="CVC"
            value={cvc}
            onChangeText={(v) => setCvc(v.replace(/[^\d]/g, '').slice(0, 4))}
            placeholder="123"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            style={styles.input}
          />
        </View>
      </View>

      {error ? (
        <Text testID={testIds.addPaymentMethod.errorMessage} style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Button
        testID={testIds.addPaymentMethod.submitButton}
        title={add.isPending ? 'Saving…' : 'Save card'}
        onPress={onSubmit}
        loading={add.isPending}
      />

      <Text style={styles.hint}>
        Use 4242 4242 4242 4242 to succeed; 4000 0000 0000 0002 to test a decline.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  label: { fontSize: theme.typography.caption, color: theme.colors.muted, marginTop: theme.spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  col: { flex: 1 },
  error: { color: theme.colors.danger, fontSize: theme.typography.body, marginTop: theme.spacing.sm },
  hint: {
    fontSize: theme.typography.caption,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
