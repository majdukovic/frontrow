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
import { useAuthStore } from '../state/auth';
import { Button } from '../components/Button';
import { formatPrice, formatEventDate } from '../utils/format';
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
        <Text style={styles.subtitle}>{event.artist}</Text>
        <Text style={styles.meta}>{formatEventDate(event.startsAt)}</Text>
        <Text style={styles.meta}>
          {event.venue.name} · {event.venue.city}, {event.venue.country}
        </Text>
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
  subtitle: { fontSize: theme.typography.title, color: theme.colors.text },
  meta: { fontSize: theme.typography.body, color: theme.colors.muted },
  actions: { marginTop: theme.spacing.lg },
  error: { color: theme.colors.danger, fontSize: theme.typography.body },
});
