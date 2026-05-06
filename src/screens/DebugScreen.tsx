import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert, Switch, TextInput } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { Section } from '../components/Section';
import { Row } from '../components/Row';
import { Button } from '../components/Button';
import { useQaStore, NETWORK_PROFILES } from '../state/qa';
import { useAuthStore } from '../state/auth';
import { useAnalyticsStore } from '../state/analytics';
import { useBillingStore, type PurchaseOutcome } from '../state/billing';
import { useSettingsStore } from '../state/settings';
import { scenarios, type ScenarioId } from '../mocks/seed/scenarios/registry';
import { resetMockState } from '../mocks/state';
import { getBuildInfo } from '../utils/buildInfo';

const PRESET_TIME_OFFSETS: { label: string; ms: number }[] = [
  { label: 'Now', ms: 0 },
  { label: '+1h', ms: 60 * 60 * 1000 },
  { label: '+1d', ms: 24 * 60 * 60 * 1000 },
  { label: '+1w', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '+1mo', ms: 30 * 24 * 60 * 60 * 1000 },
];

const FORCE_ERROR_MODES: {
  label: string;
  value: 'none' | '4xx' | '5xx' | 'timeout' | 'offline';
}[] = [
  { label: 'None', value: 'none' },
  { label: '4xx', value: '4xx' },
  { label: '5xx', value: '5xx' },
  { label: 'Timeout', value: 'timeout' },
  { label: 'Offline', value: 'offline' },
];

const IAP_OUTCOMES: { label: string; value: PurchaseOutcome }[] = [
  { label: 'Success', value: 'success' },
  { label: 'Decline', value: 'decline' },
  { label: 'Cancel', value: 'cancel' },
  { label: 'Pending', value: 'pending' },
];

export function DebugScreen() {
  const nav = useNavigation();
  const qc = useQueryClient();
  const qa = useQaStore();
  const clearAuth = useAuthStore((s) => s.clear);
  const events = useAnalyticsStore((s) => s.events);
  const clearEvents = useAnalyticsStore((s) => s.clear);
  const billing = useBillingStore();
  const buildInfo = getBuildInfo();

  const [localeDraft, setLocaleDraft] = useState(qa.locale ?? '');

  const applyScenario = (id: ScenarioId) => {
    scenarios[id].apply();
    void qa.setScenario(id);
    void qc.invalidateQueries();
    Alert.alert('Scenario applied', scenarios[id].label);
  };

  const wipe = async () => {
    resetMockState();
    await qa.reset();
    await clearAuth();
    await billing.reset();
    qc.clear();
    Alert.alert('Reset', 'All local data and QA settings cleared.');
  };

  const fakePush = () => {
    Alert.alert('FrontRow', 'Doors open in 1 hour at Warsaw, Brooklyn. Tap to view your ticket.');
  };

  const crash = () => {
    setTimeout(() => {
      throw new Error('FrontRow QA: intentional crash from Debug menu');
    }, 0);
  };

  return (
    <ScrollView
      testID={testIds.debug.screen}
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingVertical: theme.spacing.md }}
    >
      <Section title="Build">
        <Row label="App" value={buildInfo.appName} />
        <Row label="Version" value={`${buildInfo.version} (${buildInfo.buildNumber})`} />
        <Row label="Platform" value={`${buildInfo.platform} ${buildInfo.osVersion}`} />
        <Row label="Expo SDK" value={buildInfo.expoSdk} />
        <Row label="Env" value={buildInfo.env} />
      </Section>

      <Section title="Jump to screen">
        <Row
          label="Events"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'Events' }))}
        />
        <Row
          label="My Tickets"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'MyTickets' }))}
        />
        <Row
          label="Profile"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'Profile' }))}
        />
        <Row
          label="Sign in"
          onPress={() =>
            nav.dispatch(CommonActions.navigate({ name: 'Profile', params: { screen: 'Login' } }))
          }
        />
      </Section>

      <Section title="Device capabilities">
        <Row
          label="Haptics"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'HapticDemo' }))}
        />
        <Row
          label="Location"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'LocationDemo' }))}
        />
        <Row
          label="Biometric"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'BiometricDemo' }))}
        />
        <Row
          label="Camera"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'CameraDemo' }))}
        />
        <Row
          label="Microphone"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'MicrophoneDemo' }))}
        />
        <Row
          label="Calendar"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'CalendarDemo' }))}
        />
        <Row
          label="Share"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'ShareDemo' }))}
        />
        <Row
          label="Notifications"
          onPress={() => nav.dispatch(CommonActions.navigate({ name: 'NotificationsDemo' }))}
        />
      </Section>

      <Section title="Scenarios">
        {(Object.keys(scenarios) as ScenarioId[]).map((id) => (
          <Row
            key={id}
            testID={testIds.debug.seedScenarioButton(id)}
            label={scenarios[id].label}
            value={qa.scenario === id ? '✓' : undefined}
            onPress={() => applyScenario(id)}
          />
        ))}
      </Section>

      <Section title="Time travel">
        <View style={styles.chips}>
          {PRESET_TIME_OFFSETS.map((p) => (
            <Button
              key={p.label}
              testID={`debug.timeOffset.${p.ms}`}
              title={p.label}
              variant={qa.timeOffsetMs === p.ms ? 'primary' : 'secondary'}
              onPress={() => void qa.setTimeOffsetMs(p.ms)}
            />
          ))}
        </View>
        <Row label="Offset (ms)" value={String(qa.timeOffsetMs)} />
      </Section>

      <Section title="Network">
        <Row label="Force error">
          <View style={styles.chips}>
            {FORCE_ERROR_MODES.map((m) => (
              <Button
                key={m.value}
                title={m.label}
                variant={qa.forceError === m.value ? 'primary' : 'secondary'}
                onPress={() => {
                  void qa.setForceError(m.value);
                  void qc.invalidateQueries();
                }}
                testID={m.value === 'none' ? undefined : `debug.forceError.${m.value}`}
              />
            ))}
          </View>
        </Row>
        <Row label="Profile">
          <View style={styles.chips}>
            {NETWORK_PROFILES.map((p) => (
              <Button
                key={p.id}
                testID={testIds.debug.networkProfile(p.id)}
                title={p.label}
                variant={qa.networkProfile === p.id ? 'primary' : 'secondary'}
                onPress={() => {
                  void qa.setNetworkProfile(p.id);
                  void qc.invalidateQueries();
                }}
              />
            ))}
          </View>
        </Row>
        <Row label="Effective delay" value={`${qa.networkDelayMs}ms`} />
      </Section>

      <Section title="Locale">
        <Row label="Override">
          <TextInput
            placeholder="e.g. en, ja, de-DE"
            value={localeDraft}
            onChangeText={setLocaleDraft}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            testID="debug.localeInput"
          />
          <Button
            testID="debug.localeSet"
            title="Set"
            variant="secondary"
            onPress={() => void qa.setLocale(localeDraft.trim() || null)}
          />
        </Row>
        <Row label="Active" value={qa.locale ?? 'device default'} />
      </Section>

      <Section title="Notifications & crashes">
        <Row testID={testIds.debug.fakePushButton} label="Fire fake push" onPress={fakePush} />
        <Row testID={testIds.debug.crashButton} label="Trigger crash" onPress={crash} />
      </Section>

      <Section title="First-run">
        <Row
          testID={testIds.debug.replayOnboardingButton}
          label="Replay onboarding"
          onPress={() => void useSettingsStore.getState().startOnboarding()}
        />
      </Section>

      <Section title="Failure triggers">
        {(
          [
            ['push', 'Push delivery fails'],
            ['geolocation', 'Geolocation denied'],
            ['camera', 'Camera denied'],
            ['biometric', 'Biometric unavailable'],
            ['imageUpload', 'Image upload fails'],
            ['sessionExpired', 'Session expired'],
            ['paymentTimeout', 'Payment timeout'],
            ['reviewSubmit', 'Review submit fails'],
          ] as const
        ).map(([kind, label]) => (
          <Row label={label} key={kind}>
            <Switch
              testID={testIds.debug.triggerToggle(kind)}
              accessibilityLabel={label}
              value={qa.triggers[kind]}
              onValueChange={(v) => qa.setTrigger(kind, v)}
            />
          </Row>
        ))}
        <Row
          testID={testIds.debug.clearTriggersButton}
          label="Clear all triggers"
          onPress={() => qa.clearTriggers()}
        />
      </Section>

      <Section title="In-app purchases">
        <Row label="Outcome">
          <View style={styles.chips}>
            {IAP_OUTCOMES.map((m) => (
              <Button
                key={m.value}
                title={m.label}
                variant={billing.outcome === m.value ? 'primary' : 'secondary'}
                onPress={() => void billing.setOutcome(m.value)}
                testID={`debug.iap.${m.value}`}
              />
            ))}
          </View>
        </Row>
        <Row label="Receipts" value={String(billing.receipts.length)} />
        <Row testID="debug.iap.reset" label="Reset receipts" onPress={() => void billing.reset()} />
      </Section>

      <Section title="Reset">
        <Row testID={testIds.debug.resetButton} label="Wipe all local data" onPress={wipe} />
      </Section>

      <Section title="Analytics events">
        <Row
          label="Clear log"
          onPress={() => {
            clearEvents();
          }}
        />
        {events.slice(0, 20).map((e) => (
          <Row key={e.id} label={e.name} value={new Date(e.at).toLocaleTimeString()} />
        ))}
        {events.length === 0 && (
          <View style={{ padding: theme.spacing.md }}>
            <Text style={{ color: theme.colors.muted }}>No events fired yet.</Text>
          </View>
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    color: theme.colors.text,
  },
});
