import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { theme } from '../../theme';
import { testIds } from '../../testIds';
import { Button } from '../../components/Button';
import { useResetPassword } from '../../hooks/useAuth';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ route }: Props) {
  const { resetToken } = route.params;
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { mutateAsync, isPending } = useResetPassword();

  const passwordError =
    newPassword.length === 0
      ? null
      : newPassword.length < 6
        ? 'Password must be at least 6 characters.'
        : null;
  const matchError =
    confirmPassword.length === 0
      ? null
      : newPassword !== confirmPassword
        ? "Passwords don't match."
        : null;
  const canSubmit =
    newPassword.length >= 6 && newPassword === confirmPassword && !isPending && !success;

  const onSubmit = async () => {
    setError(null);
    if (!canSubmit) return;
    try {
      await mutateAsync({ resetToken, newPassword });
      setSuccess(true);
      setTimeout(() => {
        nav.popToTop();
      }, 1200);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <View style={styles.container} testID={testIds.resetPassword.screen}>
      <Text style={styles.heading} accessibilityRole="header">
        New password
      </Text>
      <Text style={styles.body}>Choose a password with at least 6 characters.</Text>
      <View>
        <TextInput
          testID={testIds.resetPassword.newPasswordInput}
          accessibilityLabel="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="New password"
          style={[styles.input, passwordError != null && styles.inputError]}
        />
        {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
      </View>
      <View>
        <TextInput
          testID={testIds.resetPassword.confirmPasswordInput}
          accessibilityLabel="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Confirm password"
          style={[styles.input, matchError != null && styles.inputError]}
        />
        {matchError && <Text style={styles.errorText}>{matchError}</Text>}
      </View>
      {error != null && (
        <Text testID={testIds.resetPassword.errorMessage} style={styles.errorText}>
          {error}
        </Text>
      )}
      {success && (
        <Text testID={testIds.resetPassword.successMessage} style={styles.successText}>
          Password updated. Sign in with the new one.
        </Text>
      )}
      <Button
        testID={testIds.resetPassword.submitButton}
        title={isPending ? 'Saving…' : success ? 'Done' : 'Save password'}
        onPress={onSubmit}
        loading={isPending}
        disabled={!canSubmit}
      />
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
  successText: {
    fontSize: theme.typography.body,
    color: theme.colors.success,
    textAlign: 'center',
  },
});
