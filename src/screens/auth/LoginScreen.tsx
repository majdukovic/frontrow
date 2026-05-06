import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import { testIds } from '../../testIds';
import { Button } from '../../components/Button';
import { useLogin } from '../../hooks/useAuth';

export function LoginScreen() {
  const nav = useNavigation();
  const [email, setEmail] = useState('demo@frontrow.app');
  const [password, setPassword] = useState('demo1234');
  const { mutateAsync, isPending } = useLogin();

  const onSubmit = async () => {
    try {
      await mutateAsync({ email: email.trim(), password });
      if (nav.canGoBack()) nav.goBack();
    } catch (e) {
      Alert.alert('Sign in failed', (e as Error).message);
    }
  };

  return (
    <View style={styles.container} testID={testIds.login.screen}>
      <Text style={styles.heading} accessibilityRole="header">
        Sign in
      </Text>
      <TextInput
        testID={testIds.login.emailInput}
        accessibilityLabel="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        style={styles.input}
      />
      <TextInput
        testID={testIds.login.passwordInput}
        accessibilityLabel="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        style={styles.input}
      />
      <Button
        testID={testIds.login.submitButton}
        title={isPending ? 'Signing in…' : 'Sign in'}
        onPress={onSubmit}
        loading={isPending}
      />
      <Text style={styles.hint}>Demo: demo@frontrow.app / demo1234</Text>
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
  heading: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  hint: {
    fontSize: theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});
