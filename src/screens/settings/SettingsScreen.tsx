import { ScrollView, View, Switch, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../theme';
import { testIds } from '../../testIds';
import { Section } from '../../components/Section';
import { Row } from '../../components/Row';
import { useSettingsStore } from '../../state/settings';
import { useQaStore } from '../../state/qa';
import type { ProfileStackParamList } from '../../navigation/types';

export function SettingsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { i18n: i18nInstance } = useTranslation();
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const qaLocale = useQaStore((s) => s.locale);
  const language = qaLocale ?? i18nInstance.language;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      testID={testIds.settings.screen}
    >
      <Section title="Preferences">
        <Row label="Push notifications">
          <Switch
            testID={testIds.settings.notificationsToggle}
            accessibilityLabel="Push notifications"
            value={notificationsEnabled}
            onValueChange={(v) => void setNotificationsEnabled(v)}
          />
        </Row>
        <Row
          testID={testIds.settings.languageRow}
          label="Language"
          value={language}
          onPress={() => nav.navigate('Language')}
        />
      </Section>

      <Section title="Billing">
        <Row
          testID={testIds.settings.paymentMethodsRow}
          label="Payment methods"
          onPress={() => nav.navigate('PaymentMethods')}
        />
      </Section>

      <Section title="About">
        <Row
          testID={testIds.settings.aboutRow}
          label="About FrontRow"
          onPress={() => nav.navigate('About')}
        />
        <Row
          testID={testIds.settings.privacyRow}
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
});
