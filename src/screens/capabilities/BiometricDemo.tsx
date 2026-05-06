import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { theme } from '../../theme';
import { Button } from '../../components/Button';
import { Section } from '../../components/Section';
import { Row } from '../../components/Row';
import { useQaStore } from '../../state/qa';

export function BiometricDemo() {
  const [supported, setSupported] = useState<string>('—');
  const [enrolled, setEnrolled] = useState<string>('—');
  const [lastResult, setLastResult] = useState<string>('—');

  const probe = async () => {
    if (useQaStore.getState().triggers.biometric) {
      // Simulate a device that hasn't enrolled biometrics or doesn't
      // support them — the QA "biometric unavailable" failure mode.
      setSupported('none');
      setEnrolled('no');
      return;
    }
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setSupported(
      types
        .map((t) =>
          t === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
            ? 'Face'
            : t === LocalAuthentication.AuthenticationType.FINGERPRINT
              ? 'Fingerprint'
              : t === LocalAuthentication.AuthenticationType.IRIS
                ? 'Iris'
                : `type ${t}`,
        )
        .join(', ') || 'none',
    );
    setEnrolled(isEnrolled ? 'yes' : 'no');
  };

  const auth = async () => {
    if (useQaStore.getState().triggers.biometric) {
      setLastResult('failed: biometric_unavailable');
      return;
    }
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to view your ticket',
      fallbackLabel: 'Use passcode',
    });
    setLastResult(r.success ? 'success' : `failed: ${r.error ?? 'unknown'}`);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingVertical: theme.spacing.md }}
      testID="screen.capability.biometric"
    >
      <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
        <Text style={styles.heading} accessibilityRole="header">
          Biometric
        </Text>
        <Text style={styles.body}>Probe Face ID / fingerprint and run an authentication.</Text>
      </View>

      <Section title="Device capabilities">
        <Row label="Supported types" value={supported} />
        <Row label="Enrolled" value={enrolled} />
      </Section>

      <View style={styles.actions}>
        <Button
          title="Probe"
          variant="secondary"
          onPress={() => void probe()}
          testID="biometric.probe"
        />
        <Button title="Authenticate" onPress={() => void auth()} testID="biometric.authenticate" />
      </View>

      <Section title="Last result">
        <Row label="Outcome" value={lastResult} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  body: { fontSize: theme.typography.body, color: theme.colors.muted, marginTop: theme.spacing.xs },
  actions: { padding: theme.spacing.md, gap: theme.spacing.sm },
});
