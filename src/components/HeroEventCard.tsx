import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

import { theme } from '../theme';
import { testIds } from '../testIds';
import type { Event } from '../api/types';
import { formatPrice, formatDateShort } from '../utils/format';

type Props = {
  event: Event;
  onPress: (event: Event) => void;
};

export function HeroEventCard({ event, onPress }: Props) {
  // The hero is the same event the list would otherwise render at index 0.
  // Tests target events.item.<id> regardless of layout — keep that contract
  // so existing browse / buy / favorites flows still drive the first event.
  return (
    <View testID={testIds.events.heroCard}>
      <Pressable
        testID={testIds.events.item(event.id)}
        accessibilityRole="button"
        accessibilityLabel={`Featured: ${event.title}`}
        onPress={() => onPress(event)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
      <Image source={{ uri: event.imageUrl }} style={styles.image} accessible={false} />
      <View style={styles.overlay} pointerEvents="none" />
      <View style={styles.overlayMid} pointerEvents="none" />
      <View style={styles.overlayBottom} pointerEvents="none" />
      <View style={styles.featuredBadge}>
        <Text style={styles.featuredText}>FEATURED</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {event.artist}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{formatDateShort(event.startsAt)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {event.venue.city}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.price}>
            {event.soldOut ? 'Sold out' : formatPrice(event.priceCents, event.currency)}
          </Text>
        </View>
      </View>
    </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 220,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  cardPressed: { opacity: 0.85 },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  // Three stacked translucent layers fake a vertical gradient — the
  // text region is fully covered while the top of the image stays
  // bright enough to read the FEATURED badge.
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '85%',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlayMid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  featuredBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primaryText,
    letterSpacing: 1,
  },
  content: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: theme.spacing.md,
  },
  title: { fontSize: theme.typography.heading, fontWeight: '800', color: '#fff' },
  artist: { fontSize: theme.typography.body, color: '#fff', opacity: 0.95, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  meta: { fontSize: theme.typography.caption, color: '#fff', opacity: 0.85 },
  dot: { color: '#fff', opacity: 0.7 },
  price: { fontSize: theme.typography.title, fontWeight: '700', color: '#fff' },
});
