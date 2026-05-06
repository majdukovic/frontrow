import { useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  Share,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { useEvent } from '../hooks/useEvents';
import { useFavoriteEventIds, useToggleFavorite } from '../hooks/useFavorites';
import {
  useArtistByName,
  useFollowedArtists,
  useToggleFollowArtist,
} from '../hooks/useArtists';
import { useAuthStore } from '../state/auth';
import { useRecentlyViewedStore } from '../state/recentlyViewed';
import { Button } from '../components/Button';
import { formatPrice, formatEventDate, formatTimeShort } from '../utils/format';
import type { EventsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetail'>;

export function EventDetailScreen({ route }: Props) {
  const { id } = route.params;
  const nav = useNavigation<NativeStackNavigationProp<EventsStackParamList>>();
  const { data: event, isLoading, error } = useEvent(id);
  const isSignedIn = Boolean(useAuthStore((s) => s.token));
  const { data: favIds } = useFavoriteEventIds();
  const toggleFavorite = useToggleFavorite();
  const isFavorite = (favIds ?? []).includes(id);
  const { data: artist } = useArtistByName(event?.artist);
  const { data: followed } = useFollowedArtists();
  const toggleFollow = useToggleFollowArtist();
  const isFollowing = artist ? (followed ?? []).some((a) => a.id === artist.id) : false;
  const pushRecent = useRecentlyViewedStore((s) => s.push);
  useEffect(() => {
    if (event?.id) void pushRecent(event.id);
  }, [event?.id, pushRecent]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error || !event) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Event not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID={testIds.eventDetail.screen}
      contentContainerStyle={styles.content}
      style={{ backgroundColor: theme.colors.background }}
    >
      <Image source={{ uri: event.imageUrl }} style={styles.hero} accessible={false} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            testID={testIds.eventDetail.title}
            style={styles.title}
            accessibilityRole="header"
          >
            {event.title}
          </Text>
          <Pressable
            testID={testIds.eventDetail.shareButton}
            accessibilityRole="button"
            accessibilityLabel="Share event"
            onPress={() =>
              void Share.share({
                message: `${event.title} — ${event.artist} at ${event.venue.name}\nfrontrow://events/${event.id}`,
              })
            }
            hitSlop={12}
            style={styles.heart}
          >
            <Ionicons name="share-outline" size={26} color={theme.colors.text} />
          </Pressable>
          {isSignedIn ? (
            <Pressable
              testID={testIds.eventDetail.favoriteButton}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              accessibilityState={{ selected: isFavorite }}
              onPress={() =>
                void toggleFavorite.mutateAsync({ eventId: event.id, favorite: !isFavorite })
              }
              hitSlop={12}
              style={styles.heart}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={28}
                color={isFavorite ? theme.colors.primary : theme.colors.muted}
              />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.artistRow}>
          <Text style={styles.subtitle}>{event.artist}</Text>
          {isSignedIn && artist ? (
            <Pressable
              testID={testIds.eventDetail.followArtistButton}
              accessibilityRole="button"
              accessibilityLabel={isFollowing ? 'Unfollow artist' : 'Follow artist'}
              accessibilityState={{ selected: isFollowing }}
              onPress={() =>
                void toggleFollow.mutateAsync({ artistId: artist.id, follow: !isFollowing })
              }
              style={[styles.followPill, isFollowing && styles.followPillActive]}
              hitSlop={8}
            >
              <Text
                style={[styles.followPillText, isFollowing && styles.followPillTextActive]}
              >
                {isFollowing ? 'Following' : '+ Follow'}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.meta}>{formatEventDate(event.startsAt)}</Text>
        <Text style={styles.meta}>
          {event.venue.name} · {event.venue.city}, {event.venue.country}
        </Text>
        {event.lineup && event.lineup.length > 0 ? (
          <View testID={testIds.eventDetail.lineup} style={styles.lineupBlock}>
            <Text style={styles.sectionHeading}>Lineup</Text>
            {event.lineup.map((slot, i) => (
              <View
                key={`${slot.artist}-${slot.startsAt}`}
                testID={testIds.eventDetail.lineupItem(i)}
                style={styles.lineupRow}
              >
                <Text style={styles.lineupTime}>{formatTimeShort(slot.startsAt)}</Text>
                <Text style={[styles.lineupArtist, slot.isHeadliner && styles.lineupHeadliner]}>
                  {slot.artist}
                  {slot.isHeadliner ? '  ★' : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {event.refundPolicy ? (
          <View testID={testIds.eventDetail.refundPolicy} style={styles.refundBlock}>
            <View style={styles.refundHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.success} />
              <Text style={styles.refundTitle}>Refund policy</Text>
            </View>
            {event.refundPolicy.refundableUntil ? (
              <Text style={styles.refundLine}>
                Refundable until {formatEventDate(event.refundPolicy.refundableUntil)}
              </Text>
            ) : (
              <Text style={styles.refundLine}>Non-refundable.</Text>
            )}
            {event.refundPolicy.note ? (
              <Text style={styles.refundNote}>{event.refundPolicy.note}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            testID={testIds.eventDetail.buyButton}
            title={
              event.soldOut ? 'Sold out' : `Buy · ${formatPrice(event.priceCents, event.currency)}`
            }
            disabled={event.soldOut}
            onPress={() => nav.navigate('BuyTicket', { eventId: event.id })}
          />
          <Button
            testID={testIds.eventDetail.reviewsButton}
            title="Reviews"
            variant="secondary"
            onPress={() => nav.navigate('EventReviews', { eventId: event.id })}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: theme.spacing.xl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  hero: { width: '100%', aspectRatio: 16 / 9, backgroundColor: theme.colors.surface },
  body: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  heart: { padding: theme.spacing.xs },
  title: {
    flex: 1,
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: { fontSize: theme.typography.title, color: theme.colors.text, flex: 1 },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  followPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  followPillActive: { backgroundColor: theme.colors.primary },
  followPillText: { fontSize: theme.typography.caption, fontWeight: '700', color: theme.colors.primary },
  followPillTextActive: { color: theme.colors.primaryText },
  meta: { fontSize: theme.typography.body, color: theme.colors.muted },
  sectionHeading: {
    fontSize: theme.typography.title,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  lineupBlock: { marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  lineupRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  lineupTime: {
    fontSize: theme.typography.body,
    color: theme.colors.muted,
    minWidth: 64,
    fontVariant: ['tabular-nums'],
  },
  lineupArtist: { flex: 1, fontSize: theme.typography.body, color: theme.colors.text },
  lineupHeadliner: { fontWeight: '700' },
  refundBlock: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  refundHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  refundTitle: { fontSize: theme.typography.body, fontWeight: '700', color: theme.colors.text },
  refundLine: { fontSize: theme.typography.body, color: theme.colors.text },
  refundNote: { fontSize: theme.typography.caption, color: theme.colors.muted, lineHeight: 18 },
  actions: { marginTop: theme.spacing.lg },
  error: { color: theme.colors.danger, fontSize: theme.typography.body },
});
