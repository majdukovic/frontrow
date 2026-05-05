import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { Section } from '../components/Section';
import { Row } from '../components/Row';
import { Button } from '../components/Button';
import { useQaStore } from '../state/qa';
import { useAuthStore } from '../state/auth';
import { useAnalyticsStore } from '../state/analytics';
import { scenarios, type ScenarioId } from '../mocks/seed/scenarios/registry';
import { resetMockState } from '../mocks/state';
import { getBuildInfo } from '../utils/buildInfo';

const PRESET_DELAYS = [0, 500, 1500, 3000];
const PRESET_TIME_OFFSETS: { label: string; ms: number }[] = [
  { label: 'Now', ms: 0 },
  { label: '+1h', ms: 60 * 60 * 1000 },
  { label: '+1d', ms: 24 * 60 * 60 * 1000 },
  { label: '+1w', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '+1mo', ms: 30 * 24 * 60 * 60 * 1000 },
];

const FORCE_ERROR_MODES: { label: string; value: 'none' | '4xx' | '5xx' | 'timeout' }[] = [
  { label: 'None', value: 'none' },
  { label: '4xx', value: '4xx' },
  { label: '5xx', value: '5xx' },
  { label: 'Timeout', value: 'timeout' },
];

export function DebugScreen() {
  const nav = useNavigation();
  const qc = useQueryClient();
  const qa = useQaStore();
  const clearAuth = useAuthStore((s) => s.clear);
  const events = useAnalyticsStore((s) => s.events);
  const clearEvents = useAnalyticsStore((s) => s.clear);
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
                onPress={() => void qa.setForceError(m.value)}
                testID={m.value === 'none' ? undefined : `debug.forceError.${m.value}`}
              />
            ))}
          </View>
        </Row>
        <Row label="Delay">
          <View style={styles.chips}>
            {PRESET_DELAYS.map((ms) => (
              <Button
                key={ms}
                title={ms === 0 ? 'Off' : `${ms}ms`}
                variant={qa.networkDelayMs === ms ? 'primary' : 'secondary'}
                onPress={() => void qa.setNetworkDelayMs(ms)}
              />
            ))}
          </View>
        </Row>
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
