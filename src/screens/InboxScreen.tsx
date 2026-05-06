import { useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { EmptyState } from '../components/EmptyState';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useUnreadNotificationCount,
} from '../hooks/useNotifications';
import type { EventsStackParamList } from '../navigation/types';
import type { AppNotification, NotificationKind } from '../api/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

const KIND_ICON: Record<NotificationKind, IoniconName> = {
  event: 'calendar',
  ticket: 'ticket',
  promo: 'pricetag',
  system: 'information-circle',
};

export function InboxScreen() {
  const nav = useNavigation<NativeStackNavigationProp<EventsStackParamList>>();
  const { data, isLoading, isRefetching, refetch, error } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unread = useUnreadNotificationCount();

  useLayoutEffect(() => {
    nav.setOptions({
      title: 'Inbox',
      headerRight: () =>
        unread > 0 ? (
          <Pressable
            testID={testIds.inbox.markAllReadButton}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            onPress={() => void markAllRead.mutate()}
            hitSlop={12}
            style={{ paddingHorizontal: theme.spacing.md }}
          >
            <Text style={styles.headerAction}>Mark all read</Text>
          </Pressable>
        ) : null,
    });
  }, [nav, unread, markAllRead]);

  const onTap = (n: AppNotification) => {
    if (!n.readAt) void markRead.mutate(n.id);
    if (n.eventId) nav.navigate('EventDetail', { id: n.eventId });
  };

  if (isLoading) {
    return (
      <View style={styles.center} testID={testIds.inbox.screen}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center} testID={testIds.inbox.screen}>
        <Text style={styles.error}>Failed to load notifications.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testIds.inbox.screen}>
      <FlatList
        testID={testIds.inbox.list}
        data={data ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={data && data.length > 0 ? undefined : styles.emptyContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => {
          const isUnread = !item.readAt;
          return (
            <Pressable
              testID={testIds.inbox.item(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: !isUnread }}
              onPress={() => onTap(item)}
              style={[styles.row, isUnread && styles.rowUnread]}
            >
              <Ionicons
                name={KIND_ICON[item.kind]}
                size={22}
                color={theme.colors.text}
                style={styles.icon}
              />
              <View style={styles.body}>
                <Text style={[styles.title, isUnread && styles.titleUnread]}>{item.title}</Text>
                <Text style={styles.text} numberOfLines={2}>
                  {item.body}
                </Text>
              </View>
              {isUnread ? (
                <View testID={testIds.inbox.unreadDot(item.id)} style={styles.dot} />
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            testID={testIds.inbox.emptyState}
            icon="mail-open-outline"
            title="You're all caught up"
            body="New events, ticket updates, and promos will land here."
          />
        }
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
  },
  emptyContent: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  rowUnread: { backgroundColor: theme.colors.surface },
  icon: { marginTop: 2 },
  body: { flex: 1 },
  title: { fontSize: theme.typography.body, color: theme.colors.text },
  titleUnread: { fontWeight: '700' },
  text: { fontSize: theme.typography.caption, color: theme.colors.muted, marginTop: 2 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
  },
  muted: { color: theme.colors.muted, fontSize: theme.typography.body },
  error: { color: theme.colors.danger, fontSize: theme.typography.body },
  headerAction: { color: theme.colors.primary, fontSize: theme.typography.body, fontWeight: '500' },
});
