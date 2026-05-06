import { ScrollView, View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { useEvent } from '../hooks/useEvents';
import { Button } from '../components/Button';
import { formatPrice, formatEventDate } from '../utils/format';
import type { EventsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetail'>;

export function EventDetailScreen({ route }: Props) {
  const { id } = route.params;
  const nav = useNavigation<NativeStackNavigationProp<EventsStackParamList>>();
  const { data: event, isLoading, error } = useEvent(id);

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
        <Text testID={testIds.eventDetail.title} style={styles.title} accessibilityRole="header">
          {event.title}
        </Text>
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
            testID="eventDetail.reviewsButton"
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
  title: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  subtitle: { fontSize: theme.typography.title, color: theme.colors.text },
  meta: { fontSize: theme.typography.body, color: theme.colors.muted },
  actions: { marginTop: theme.spacing.lg },
  error: { color: theme.colors.danger, fontSize: theme.typography.body },
});
