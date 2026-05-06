import { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { SwipeableRow } from '../components/SwipeableRow';
import { useMyTickets, useCancelTicket } from '../hooks/useTickets';
import { useAuthStore } from '../state/auth';
import { formatPrice, formatEventDate } from '../utils/format';
import type { TicketsStackParamList } from '../navigation/types';
import type { TicketStatus, Ticket } from '../api/types';

type Filter = 'all' | 'active' | 'past';

const ACTIVE_STATUSES: TicketStatus[] = ['active', 'refund_pending'];

export function MyTicketsListScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<TicketsStackParamList>>();
  const token = useAuthStore((s) => s.token);
  const { data, isLoading, isRefetching, refetch, error } = useMyTickets();
  const cancel = useCancelTicket();
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(() => {
    const all = data ?? [];
    if (filter === 'active') return all.filter((tk) => ACTIVE_STATUSES.includes(tk.status));
    if (filter === 'past') return all.filter((tk) => !ACTIVE_STATUSES.includes(tk.status));
    return all;
  }, [data, filter]);

  if (!token) {
    return (
      <View style={{ flex: 1 }} testID={testIds.myTickets.screen}>
        <EmptyState
          icon="ticket-outline"
          title="Sign in to see tickets"
          body="Your purchased tickets will live here once you have an account."
        />
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

  return (
    <View style={styles.container} testID={testIds.myTickets.screen}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        <Chip
          testID={testIds.myTickets.filterChip('all')}
          label="All"
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <Chip
          testID={testIds.myTickets.filterChip('active')}
          label="Active"
          selected={filter === 'active'}
          onPress={() => setFilter('active')}
        />
        <Chip
          testID={testIds.myTickets.filterChip('past')}
          label="Past"
          selected={filter === 'past'}
          onPress={() => setFilter('past')}
        />
      </ScrollView>
      <FlatList
        testID={testIds.myTickets.list}
        data={items}
        keyExtractor={(t) => t.id}
        contentContainerStyle={
          items.length === 0
            ? styles.emptyContent
            : { padding: theme.spacing.md, gap: theme.spacing.md }
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <TicketRow
            ticket={item}
            onPress={() => nav.navigate('TicketDetail', { id: item.id })}
            onSwipeCancel={() => cancel.mutate(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            testID={testIds.myTickets.emptyState}
            icon="ticket-outline"
            title={t('myTickets.heading')}
            body={filter === 'all' ? t('myTickets.placeholder') : `No ${filter} tickets.`}
          />
        }
      />
    </View>
  );
}

function TicketRow({
  ticket,
  onPress,
  onSwipeCancel,
}: {
  ticket: Ticket;
  onPress: () => void;
  onSwipeCancel: () => void;
}) {
  const card = (
    <Pressable
      testID={testIds.myTickets.item(ticket.id)}
      accessibilityRole="button"
      accessibilityLabel={`${ticket.tier} ticket, ${ticket.status}`}
      onPress={onPress}
    >
      <Card>
        <Text style={styles.cardTitle}>{ticket.tier}</Text>
        <Text style={styles.cardMeta}>Purchased {formatEventDate(ticket.purchasedAt)}</Text>
        <Text style={styles.cardMeta}>
          {ticket.quantity} × · {formatPrice(ticket.totalCents, ticket.currency)} ·{' '}
          <Text testID={`myTickets.status.${ticket.id}`} style={styles.status}>
            {ticket.status.replace('_', ' ')}
          </Text>
        </Text>
      </Card>
    </Pressable>
  );

  // Only active tickets are swipeable — past/cancelled rows have nothing
  // to act on, so we render the card without the swipe wrapper.
  if (!ACTIVE_STATUSES.includes(ticket.status)) return card;

  return (
    <SwipeableRow
      actionLabel="Cancel"
      actionTestID={testIds.myTickets.swipeCancel(ticket.id)}
      onAction={onSwipeCancel}
    >
      {card}
    </SwipeableRow>
  );
}

function Chip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
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
  emptyContent: { flexGrow: 1 },
  heading: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  muted: { color: theme.colors.muted, fontSize: theme.typography.body, textAlign: 'center' },
  error: { color: theme.colors.danger, fontSize: theme.typography.body },
  cardTitle: { fontSize: theme.typography.title, fontWeight: '600', color: theme.colors.text },
  cardMeta: { fontSize: theme.typography.caption, color: theme.colors.muted, marginTop: 4 },
  status: { color: theme.colors.text, fontWeight: '600' },
  chipScroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  chipRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  chip: {
    minHeight: 36,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: {
    fontSize: theme.typography.body,
    lineHeight: 20,
    color: theme.colors.text,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  chipTextSelected: { color: theme.colors.primaryText, fontWeight: '600' },
});
