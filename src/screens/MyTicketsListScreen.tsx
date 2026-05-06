import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { Card } from '../components/Card';
import { useMyTickets } from '../hooks/useTickets';
import { useAuthStore } from '../state/auth';
import { formatPrice, formatEventDate } from '../utils/format';

export function MyTicketsListScreen() {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const { data, isLoading, error } = useMyTickets();

  if (!token) {
    return (
      <View style={styles.center} testID={testIds.myTickets.screen}>
        <Text style={styles.muted}>Sign in to see your tickets.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center} testID={testIds.myTickets.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center} testID={testIds.myTickets.screen}>
        <Text style={styles.error}>Failed to load tickets.</Text>
      </View>
    );
  }

  if (!data?.length) {
    return (
      <View style={styles.center} testID={testIds.myTickets.screen}>
        <Text style={styles.heading}>{t('myTickets.heading')}</Text>
        <Text style={styles.muted}>{t('myTickets.placeholder')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testIds.myTickets.screen}>
      <FlatList
        testID={testIds.myTickets.list}
        data={data}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md }}
        renderItem={({ item }) => (
          <Card testID={testIds.myTickets.item(item.id)}>
            <Text style={styles.cardTitle}>{item.tier}</Text>
            <Text style={styles.cardMeta}>Purchased {formatEventDate(item.purchasedAt)}</Text>
            <Text style={styles.cardMeta}>
              {item.quantity} × · {formatPrice(item.totalCents, item.currency)} ·{' '}
              <Text testID={`myTickets.status.${item.id}`} style={styles.status}>
                {item.status}
              </Text>
            </Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  heading: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  muted: { color: theme.colors.muted, fontSize: theme.typography.body, textAlign: 'center' },
  error: { color: theme.colors.danger, fontSize: theme.typography.body },
  cardTitle: { fontSize: theme.typography.title, fontWeight: '600', color: theme.colors.text },
  cardMeta: { fontSize: theme.typography.caption, color: theme.colors.muted, marginTop: 4 },
  status: { color: theme.colors.text, fontWeight: '600' },
});
