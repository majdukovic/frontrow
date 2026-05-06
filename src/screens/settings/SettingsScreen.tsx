import { ScrollView, View, Pressable, Switch, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../theme';
import { testIds } from '../../testIds';
import { Section } from '../../components/Section';
import { Row } from '../../components/Row';
import { useSettingsStore, type Appearance } from '../../state/settings';
import { useQaStore } from '../../state/qa';
import type { ProfileStackParamList } from '../../navigation/types';

const APPEARANCE_OPTIONS: { id: Appearance; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export function SettingsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { i18n: i18nInstance } = useTranslation();
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const appearance = useSettingsStore((s) => s.appearance);
  const setAppearance = useSettingsStore((s) => s.setAppearance);
  const qaLocale = useQaStore((s) => s.locale);
  const language = qaLocale ?? i18nInstance.language;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      testID={testIds.settings.screen}
    >
      <Section title="Preferences">
        <Row icon="notifications-outline" label="Push notifications">
          <Switch
            testID={testIds.settings.notificationsToggle}
            accessibilityLabel="Push notifications"
            value={notificationsEnabled}
            onValueChange={(v) => void setNotificationsEnabled(v)}
          />
        </Row>
        <Row
          testID={testIds.settings.languageRow}
          icon="globe-outline"
          label="Language"
          value={language}
          onPress={() => nav.navigate('Language')}
        />
        <Row icon="contrast-outline" label="Appearance">
          <View style={styles.segmented}>
            {APPEARANCE_OPTIONS.map((opt) => {
              const selected = appearance === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  testID={testIds.settings.appearanceOption(opt.id)}
                  accessibilityRole="radio"
                  accessibilityLabel={`Appearance: ${opt.label}`}
                  accessibilityState={{ selected }}
                  onPress={() => void setAppearance(opt.id)}
                  style={[styles.segmentedOption, selected && styles.segmentedOptionSelected]}
                >
                  <Text
                    style={[styles.segmentedText, selected && styles.segmentedTextSelected]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Row>
      </Section>

      <Section title="Billing">
        <Row
          testID={testIds.settings.paymentMethodsRow}
          icon="card-outline"
          label="Payment methods"
          onPress={() => nav.navigate('PaymentMethods')}
        />
      </Section>

      <Section title="About">
        <Row
          testID={testIds.settings.aboutRow}
          icon="information-circle-outline"
          label="About FrontRow"
          onPress={() => nav.navigate('About')}
        />
        <Row
          testID={testIds.settings.privacyRow}
          icon="shield-checkmark-outline"
          label="Privacy policy"
          onPress={() =>
            nav.navigate('WebView', {
              url: 'https://example.com/privacy',
              title: 'Privacy policy',
            })
          }
        />
        <Row
          testID={testIds.settings.termsRow}
          icon="document-text-outline"
          label="Terms of service"
          onPress={() =>
            nav.navigate('WebView', { url: 'https://example.com/terms', title: 'Terms of service' })
          }
        />
      </Section>

      <View style={{ height: theme.spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: theme.spacing.md },
  segmented: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentedOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.sm,
  },
  segmentedOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  segmentedText: { fontSize: theme.typography.caption, color: theme.colors.text },
  segmentedTextSelected: { color: theme.colors.primaryText, fontWeight: '700' },
});
