import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { theme } from '../../theme';
import { testIds } from '../../testIds';
import { Button } from '../../components/Button';
import { useForgotPassword, useVerifyOtp } from '../../hooks/useAuth';
import type { ProfileStackParamList } from '../../navigation/types';

const RESEND_COOLDOWN = 30;

type Props = NativeStackScreenProps<ProfileStackParamList, 'Otp'>;

export function OtpScreen({ route }: Props) {
  const { email } = route.params;
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { mutateAsync: verify, isPending } = useVerifyOtp();
  const { mutateAsync: resend, isPending: isResending } = useForgotPassword();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const onSubmit = async () => {
    setError(null);
    if (code.length !== 6) {
      setError('Code must be 6 digits.');
      return;
    }
    try {
      const { resetToken } = await verify({ email, code });
      nav.navigate('ResetPassword', { resetToken });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onResend = async () => {
    await resend(email);
    setSecondsLeft(RESEND_COOLDOWN);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
  };

  return (
    <View style={styles.container} testID={testIds.otp.screen}>
      <Text style={styles.heading} accessibilityRole="header">
        Enter code
      </Text>
      <Text style={styles.body}>
        We sent a 6-digit code to <Text style={styles.bodyStrong}>{email}</Text>.
      </Text>
      <TextInput
        testID={testIds.otp.codeInput}
        accessibilityLabel="6-digit verification code"
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        style={styles.codeInput}
      />
      {error != null && (
        <Text testID={testIds.otp.errorMessage} style={styles.errorText}>
          {error}
        </Text>
      )}
      <Button
        testID={testIds.otp.submitButton}
        title={isPending ? 'Verifying…' : 'Verify'}
        onPress={onSubmit}
        loading={isPending}
        disabled={code.length !== 6}
      />
      {secondsLeft > 0 ? (
        <Text testID={testIds.otp.resendCountdown} style={styles.hint}>
          Resend code in {secondsLeft}s
        </Text>
      ) : (
        <Button
          testID={testIds.otp.resendButton}
          title={isResending ? 'Sending…' : 'Resend code'}
          variant="ghost"
          onPress={() => void onResend()}
          loading={isResending}
        />
      )}
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
  bodyStrong: { fontWeight: '600', color: theme.colors.text },
  codeInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: 28,
    letterSpacing: 12,
    textAlign: 'center',
    color: theme.colors.text,
  },
  errorText: {
    fontSize: theme.typography.caption,
    color: theme.colors.danger,
    textAlign: 'center',
  },
  hint: { fontSize: theme.typography.caption, color: theme.colors.muted, textAlign: 'center' },
});
