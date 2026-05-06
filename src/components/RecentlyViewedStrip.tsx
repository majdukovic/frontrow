import { useMemo } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { useEvents } from '../hooks/useEvents';
import { useRecentlyViewedStore } from '../state/recentlyViewed';
import type { Event } from '../api/types';

type Props = {
  onPress: (event: Event) => void;
};

export function RecentlyViewedStrip({ onPress }: Props) {
  const ids = useRecentlyViewedStore((s) => s.ids);
  const { data } = useEvents();
  const allEvents = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const ordered = useMemo(() => {
    const byId = new Map(allEvents.map((e) => [e.id, e]));
    return ids.map((id) => byId.get(id)).filter((e): e is Event => Boolean(e));
  }, [ids, allEvents]);

  if (ordered.length === 0) return null;

  return (
    <View testID={testIds.events.recentlyViewedStrip} style={styles.block}>
      <Text style={styles.heading}>Recently viewed</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {ordered.map((event) => (
          <Pressable
            key={event.id}
            testID={testIds.events.recentlyViewedItem(event.id)}
            accessibilityRole="button"
            accessibilityLabel={event.title}
            onPress={() => onPress(event)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          >
            <Image source={{ uri: event.imageUrl }} style={styles.image} accessible={false} />
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {event.venue.city}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  heading: {
    fontSize: theme.typography.title,
    fontWeight: '700',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  row: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  card: { width: 140 },
  image: {
    width: 140,
    height: 92,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  meta: {
    fontSize: theme.typography.caption,
    color: theme.colors.muted,
    marginTop: 2,
  },
});
