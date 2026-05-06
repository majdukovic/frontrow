import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';

import { failIfTriggered } from '../../state/qa';

import { theme } from '../../theme';
import { Button } from '../../components/Button';
import { Section } from '../../components/Section';
import { Row } from '../../components/Row';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function NotificationsDemo() {
  const [permission, setPermission] = useState<Notifications.PermissionStatus | 'unknown'>(
    'unknown',
  );

  const request = async () => {
    const r = await Notifications.requestPermissionsAsync();
    setPermission(r.status);
  };

  const fireImmediate = async () => {
    failIfTriggered('push', 'Push delivery failed (QA trigger).');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'FrontRow',
        body: 'Doors open in 1 hour at Warsaw, Brooklyn.',
        data: { deeplink: 'frontrow://tickets' },
      },
      trigger: null,
    });
  };

  const fireDelayed = async () => {
    failIfTriggered('push', 'Push delivery failed (QA trigger).');
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Tickets on sale', body: 'New event nearby — tap to browse.' },
      trigger: { seconds: 5, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
    });
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingVertical: theme.spacing.md }}
      testID="screen.capability.notifications"
    >
      <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
        <Text style={styles.heading} accessibilityRole="header">
          Notifications
        </Text>
        <Text style={styles.body}>Request permission and schedule local notifications.</Text>
      </View>

      <Section title="Permission">
        <Row label="Status" value={permission} />
      </Section>

      <View style={styles.actions}>
        <Button
          title="Request permission"
          variant="secondary"
          onPress={() => void request()}
          testID="notifications.requestPermission"
        />
        <Button
          title="Fire immediate"
          onPress={() => void fireImmediate()}
          testID="notifications.fireImmediate"
        />
        <Button
          title="Fire in 5s"
          variant="secondary"
          onPress={() => void fireDelayed()}
          testID="notifications.fireDelayed"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  body: { fontSize: theme.typography.body, color: theme.colors.muted, marginTop: theme.spacing.xs },
  actions: { padding: theme.spacing.md, gap: theme.spacing.sm },
});
