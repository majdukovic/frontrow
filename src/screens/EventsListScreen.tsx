import { useMemo, useState } from 'react';
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

import { theme } from '../theme';
import { testIds } from '../testIds';
import { useEvents } from '../hooks/useEvents';
import { EventListItem } from '../components/EventListItem';
import type { EventsStackParamList } from '../navigation/types';

const GENRES = ['Indie Rock', 'Classical', 'Electronic', 'Folk', 'J-Pop', 'Punk'] as const;

export function EventsListScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<EventsStackParamList>>();
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = useEvents({ q: q || undefined, genre: genre ?? undefined });

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

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
          selected={genre == null}
          onPress={() => setGenre(null)}
        />
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
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text testID={testIds.events.errorMessage} style={styles.error}>
            Failed to load events.
          </Text>
        </View>
      ) : (
        <FlatList
          testID={testIds.events.list}
          data={items}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <EventListItem
              event={item}
              onPress={(e) => nav.navigate('EventDetail', { id: e.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>No events match your search.</Text>
            </View>
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
});
