import { View, Text, Pressable, StyleSheet } from 'react-native';

import { theme } from '../theme';
import { testIds } from '../testIds';
import type { Event } from '../api/types';
import { formatPrice, formatEventDate } from '../utils/format';

type Props = {
  event: Event;
  onPress: (event: Event) => void;
};

const TILE_COLORS = [
  '#FFB4B4',
  '#FFD580',
  '#B5E5FC',
  '#C4F0C5',
  '#E2BBFF',
  '#FFC1E3',
  '#FFD8B1',
  '#B7E4C7',
];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TILE_COLORS[Math.abs(h) % TILE_COLORS.length] ?? TILE_COLORS[0]!;
}

export function EventListItem({ event, onPress }: Props) {
  const tileColor = colorFor(event.id);
  const initial = event.title.charAt(0).toUpperCase();
  return (
    <Pressable
      testID={testIds.events.item(event.id)}
      accessibilityRole="button"
      accessibilityLabel={`${event.title} at ${event.venue.name}`}
      onPress={() => onPress(event)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.image, { backgroundColor: tileColor }]} accessible={false}>
        <Text style={styles.imageInitial}>{initial}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {event.venue.name} · {event.venue.city}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.date}>{formatEventDate(event.startsAt)}</Text>
          <Text style={[styles.price, event.soldOut && styles.soldOut]}>
            {event.soldOut ? 'Sold out' : formatPrice(event.priceCents, event.currency)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInitial: { fontSize: 32, fontWeight: '700', color: 'rgba(0,0,0,0.55)' },
  body: { flex: 1, marginLeft: theme.spacing.md, justifyContent: 'space-between' },
  title: { fontSize: theme.typography.title, fontWeight: '700', color: theme.colors.text },
  subtitle: { fontSize: theme.typography.caption, color: theme.colors.muted },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: theme.typography.caption, color: theme.colors.muted },
  price: { fontSize: theme.typography.body, fontWeight: '600', color: theme.colors.primary },
  soldOut: { color: theme.colors.danger },
});
