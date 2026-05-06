import { useState } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { theme } from '../../theme';
import { useQaStore } from '../../state/qa';
import { Button } from '../../components/Button';
import { Section } from '../../components/Section';
import { Row } from '../../components/Row';

export function CameraDemo() {
  const [uri, setUri] = useState<string | null>(null);

  const fromCamera = async () => {
    if (useQaStore.getState().triggers.camera) {
      Alert.alert('Camera denied', 'Camera permission is required.');
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera denied', 'Camera permission is required.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.6 });
    if (!r.canceled) setUri(r.assets[0]?.uri ?? null);
  };

  const fromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos denied', 'Photo library permission is required.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.6 });
    if (!r.canceled) setUri(r.assets[0]?.uri ?? null);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingVertical: theme.spacing.md }}
      testID="screen.capability.camera"
    >
      <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
        <Text style={styles.heading} accessibilityRole="header">
          Camera
        </Text>
        <Text style={styles.body}>Take a photo with the camera or pick one from the library.</Text>
      </View>

      <View style={styles.actions}>
        <Button title="Take photo" onPress={() => void fromCamera()} testID="camera.takePhoto" />
        <Button
          title="Pick from library"
          variant="secondary"
          onPress={() => void fromLibrary()}
          testID="camera.pickPhoto"
        />
      </View>

      <Section title="Selected">
        {uri ? (
          <Image source={{ uri }} style={styles.preview} accessibilityLabel="Selected photo" />
        ) : (
          <Row label="None yet" />
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  body: { fontSize: theme.typography.body, color: theme.colors.muted, marginTop: theme.spacing.xs },
  actions: { padding: theme.spacing.md, gap: theme.spacing.sm },
  preview: { width: '100%', aspectRatio: 1, backgroundColor: theme.colors.surface },
});
