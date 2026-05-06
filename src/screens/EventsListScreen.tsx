import { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { useEvents } from '../hooks/useEvents';
import { useFavoriteEventIds } from '../hooks/useFavorites';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useAuthStore } from '../state/auth';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { EventListItem } from '../components/EventListItem';
import { EventListSkeleton } from '../components/EventListSkeleton';
import { HeroEventCard } from '../components/HeroEventCard';
import type { EventsStackParamList } from '../navigation/types';

const SEARCH_DEBOUNCE_MS = 300;

const GENRES = ['Indie Rock', 'Classical', 'Electronic', 'Folk', 'J-Pop', 'Punk'] as const;

export function EventsListScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<EventsStackParamList>>();
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q.trim(), SEARCH_DEBOUNCE_MS);
  const [genre, setGenre] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const isSignedIn = Boolean(useAuthStore((s) => s.token));
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = useEvents({ q: debouncedQ || undefined, genre: genre ?? undefined });
  const { data: favIds } = useFavoriteEventIds();

  const allItems = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const items = useMemo(() => {
    if (!favoritesOnly) return allItems;
    const set = new Set(favIds ?? []);
    return allItems.filter((e) => set.has(e.id));
  }, [allItems, favoritesOnly, favIds]);
  const total = data?.pages[0]?.total ?? 0;
  const unreadCount = useUnreadNotificationCount();
  const showHero = !debouncedQ && genre == null && !favoritesOnly && items.length > 1;

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () =>
        isSignedIn ? (
          <Pressable
            testID={testIds.events.inboxButton}
            accessibilityRole="button"
            accessibilityLabel={`Inbox${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            onPress={() => nav.navigate('Inbox')}
            hitSlop={12}
            style={styles.headerButton}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
            {unreadCount > 0 ? (
              <View testID={testIds.events.inboxBadge} style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null,
    });
  }, [nav, isSignedIn, unreadCount]);

  return (
    <View style={styles.container} testID={testIds.events.screen}>
      <View style={styles.searchBar}>
        <TextInput
          testID={testIds.events.searchInput}
          accessibilityLabel="Search events"
          placeholder={t('events.heading')}
          value={q}
          onChangeText={setQ}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <ScrollView
        testID={testIds.events.filterRow}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        <Chip
          testID={testIds.events.filterChip('all')}
          label="All"
          selected={genre == null && !favoritesOnly}
          onPress={() => {
            setGenre(null);
            setFavoritesOnly(false);
          }}
        />
        {isSignedIn ? (
          <Chip
            testID={testIds.events.filterChip('favorites')}
            label="♥ Favorites"
            selected={favoritesOnly}
            onPress={() => setFavoritesOnly((v) => !v)}
          />
        ) : null}
        {GENRES.map((g) => (
          <Chip
            key={g}
            testID={testIds.events.filterChip(g.toLowerCase().replace(/\s+/g, '-'))}
            label={g}
            selected={genre === g}
            onPress={() => setGenre(genre === g ? null : g)}
          />
        ))}
      </ScrollView>
      {isLoading ? (
        <EventListSkeleton testID={testIds.events.skeleton} />
      ) : error ? (
        <View style={styles.center}>
          <Text testID={testIds.events.errorMessage} style={styles.error}>
            Failed to load events.
          </Text>
          <Button
            testID={testIds.events.retryButton}
            title="Retry"
            variant="secondary"
            onPress={() => void refetch()}
          />
        </View>
      ) : (
        <FlatList
          testID={testIds.events.list}
          data={showHero ? items.slice(1) : items}
          keyExtractor={(e) => e.id}
          ListHeaderComponent={
            showHero && items[0] ? (
              <HeroEventCard
                event={items[0]}
                onPress={(e) => nav.navigate('EventDetail', { id: e.id })}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <EventListItem
              event={item}
              onPress={(e) => nav.navigate('EventDetail', { id: e.id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No events found"
              body="Try a different search term or clear the filters above."
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View
                testID={testIds.events.loadingFooter}
                style={[styles.center, { padding: theme.spacing.md }]}
              >
                <ActivityIndicator />
              </View>
            ) : !hasNextPage && items.length > 0 ? (
              <Text testID={testIds.events.endOfList} style={styles.endOfList}>
                {total} events shown · end of list
              </Text>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
        />
      )}
    </View>
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
  searchBar: {
    padding: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  muted: { color: theme.colors.muted, fontSize: theme.typography.body },
  error: { color: theme.colors.danger, fontSize: theme.typography.body },
  endOfList: {
    textAlign: 'center',
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    paddingVertical: theme.spacing.lg,
  },
  chipRow: {
    maxHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  chipRowContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: theme.typography.body, color: theme.colors.text },
  chipTextSelected: { color: theme.colors.primaryText, fontWeight: '600' },
  headerButton: { paddingHorizontal: theme.spacing.md },
  badge: {
    position: 'absolute',
    top: -2,
    right: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: theme.colors.primaryText,
    fontSize: 10,
    fontWeight: '700',
  },
});
