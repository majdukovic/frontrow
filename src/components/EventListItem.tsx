import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

import { theme } from '../theme';
import { testIds } from '../testIds';
import type { Event } from '../api/types';
import { formatPrice, formatDateShort, formatTimeShort } from '../utils/format';

type Props = {
  event: Event;
  onPress: (event: Event) => void;
};

const GENRE_HUE: Record<string, string> = {
  'indie rock': '#FFB4B4',
  classical: '#C7B7FF',
  electronic: '#9BD9FF',
  folk: '#C4F0C5',
  'j-pop': '#FFC1E3',
  punk: '#FFD580',
};

export function EventListItem({ event, onPress }: Props) {
  const genreColor = GENRE_HUE[event.genre.toLowerCase()] ?? '#E5E5EA';
  return (
    <Pressable
      testID={testIds.events.item(event.id)}
      accessibilityRole="button"
      accessibilityLabel={`${event.title} at ${event.venue.name}`}
      onPress={() => onPress(event)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Image source={{ uri: event.imageUrl }} style={styles.image} accessible={false} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>
        </View>
        <Text style={styles.artist} numberOfLines={1}>
          {event.artist}
        </Text>
        <Text style={styles.venue} numberOfLines={1}>
          {event.venue.name} · {event.venue.city}
        </Text>
        <View style={styles.footer}>
          <View style={[styles.genreChip, { backgroundColor: genreColor }]}>
            <Text style={styles.genreText}>{event.genre}</Text>
          </View>
          <Text style={styles.date}>
            {formatDateShort(event.startsAt)} · {formatTimeShort(event.startsAt)}
          </Text>
        </View>
      </View>
      <View style={styles.priceCol}>
        {event.soldOut ? (
          <View style={styles.soldOutChip}>
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        ) : (
          <>
            <Text style={styles.priceFrom}>from</Text>
            <Text style={styles.price}>{formatPrice(event.priceCents, event.currency)}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowPressed: { opacity: 0.7 },
  image: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  body: { flex: 1, justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  title: { flex: 1, fontSize: theme.typography.title, fontWeight: '700', color: theme.colors.text },
  artist: { fontSize: theme.typography.body, color: theme.colors.text, marginTop: 2 },
  venue: { fontSize: theme.typography.caption, color: theme.colors.muted, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  genreChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  genreText: { fontSize: 11, fontWeight: '600', color: 'rgba(0,0,0,0.7)' },
  date: { fontSize: theme.typography.caption, color: theme.colors.muted, flex: 1 },
  priceCol: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 60 },
  priceFrom: { fontSize: 10, color: theme.colors.muted, textTransform: 'uppercase' },
  price: { fontSize: theme.typography.title, fontWeight: '700', color: theme.colors.primary },
  soldOutChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.danger,
  },
  soldOutText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primaryText,
    textTransform: 'uppercase',
  },
});
