import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';

import { theme } from '../../theme';
import { useQaStore } from '../../state/qa';
import { Button } from '../../components/Button';
import { Section } from '../../components/Section';
import { Row } from '../../components/Row';

type Coords = { lat: number; lng: number; accuracy: number } | null;

export function LocationDemo() {
  const [permission, setPermission] = useState<Location.PermissionStatus | 'unknown'>('unknown');
  const [coords, setCoords] = useState<Coords>(null);
  const [busy, setBusy] = useState(false);

  const request = async () => {
    if (useQaStore.getState().triggers.geolocation) {
      setPermission('denied' as Location.PermissionStatus);
      return;
    }
    const r = await Location.requestForegroundPermissionsAsync();
    setPermission(r.status);
  };

  const fix = async () => {
    setBusy(true);
    try {
      const r = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({
        lat: r.coords.latitude,
        lng: r.coords.longitude,
        accuracy: r.coords.accuracy ?? 0,
      });
    } catch (e) {
      Alert.alert('Location error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingVertical: theme.spacing.md }}
      testID="screen.capability.location"
    >
      <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
        <Text style={styles.heading} accessibilityRole="header">
          Location
        </Text>
        <Text style={styles.body}>Request foreground permission and read a position fix.</Text>
      </View>

      <Section title="Permission">
        <Row label="Status" value={permission} />
      </Section>

      <View style={styles.actions}>
        <Button
          testID="location.requestPermission"
          title="Request foreground permission"
          variant="secondary"
          onPress={() => void request()}
        />
        <Button
          testID="location.getFix"
          title={busy ? 'Locating…' : 'Get current position'}
          onPress={() => void fix()}
          loading={busy}
        />
      </View>

      {coords && (
        <Section title="Last fix">
          <Row label="Latitude" value={coords.lat.toFixed(5)} />
          <Row label="Longitude" value={coords.lng.toFixed(5)} />
          <Row label="Accuracy" value={`${coords.accuracy.toFixed(1)} m`} />
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  body: { fontSize: theme.typography.body, color: theme.colors.muted, marginTop: theme.spacing.xs },
  actions: { padding: theme.spacing.md, gap: theme.spacing.sm },
});
