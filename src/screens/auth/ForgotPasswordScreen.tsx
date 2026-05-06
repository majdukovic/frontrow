import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../theme';
import { testIds } from '../../testIds';
import { Button } from '../../components/Button';
import { useForgotPassword } from '../../hooks/useAuth';
import type { ProfileStackParamList } from '../../navigation/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen() {
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const { mutateAsync, isPending } = useForgotPassword();

  const trimmed = email.trim();
  const emailError =
    trimmed.length === 0
      ? 'Email is required.'
      : !EMAIL_RE.test(trimmed)
        ? 'Enter a valid email.'
        : null;
  const showError = touched && emailError != null;

  const onSubmit = async () => {
    setTouched(true);
    if (emailError) return;
    try {
      await mutateAsync(trimmed);
      nav.navigate('Otp', { email: trimmed });
    } catch (e) {
      Alert.alert('Could not send code', (e as Error).message);
    }
  };

  return (
    <View style={styles.container} testID={testIds.forgotPassword.screen}>
      <Text style={styles.heading} accessibilityRole="header">
        Forgot password
      </Text>
      <Text style={styles.body}>
        Enter the email associated with your account. We&apos;ll send a 6-digit code.
      </Text>
      <View>
        <TextInput
          testID={testIds.forgotPassword.emailInput}
          accessibilityLabel="Email"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setTouched(true)}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email"
          style={[styles.input, showError && styles.inputError]}
        />
        {showError && <Text style={styles.errorText}>{emailError}</Text>}
      </View>
      <Button
        testID={testIds.forgotPassword.submitButton}
        title={isPending ? 'Sending…' : 'Send code'}
        onPress={onSubmit}
        loading={isPending}
        disabled={emailError != null}
      />
      <Text style={styles.hint} testID={testIds.forgotPassword.confirmation}>
        Demo OTP: 123456
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  heading: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  body: { fontSize: theme.typography.body, color: theme.colors.muted },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  inputError: { borderColor: theme.colors.danger },
  errorText: {
    fontSize: theme.typography.caption,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
  hint: { fontSize: theme.typography.caption, color: theme.colors.muted, textAlign: 'center' },
});
