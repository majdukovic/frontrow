import { useLayoutEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { Button } from '../components/Button';
import { StarRatingInput } from '../components/StarRatingInput';
import { useReviewsForEvent, usePostReview } from '../hooks/useReviews';
import { useAuthStore } from '../state/auth';
import { REVIEW_MAX_LENGTH } from '../api/services/reviews';
import type { EventsStackParamList } from '../navigation/types';
import type { Review } from '../api/types';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventReviews'>;

export function EventReviewsScreen({ route }: Props) {
  const { eventId } = route.params;
  const nav = useNavigation();
  const [rating, setRating] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading, refetch } = useReviewsForEvent(eventId);
  const { mutateAsync, isPending } = usePostReview(eventId);
  const isSignedIn = Boolean(useAuthStore((s) => s.token));

  useLayoutEffect(() => {
    nav.setOptions({ title: 'Reviews' });
  }, [nav]);

  const remaining = REVIEW_MAX_LENGTH - text.length;
  const overLimit = remaining < 0;
  const canSubmit = rating > 0 && !overLimit && !isPending;

  const onSubmit = async () => {
    setError(null);
    if (rating === 0 || overLimit) return;
    try {
      await mutateAsync({ rating: rating as 1 | 2 | 3 | 4 | 5, text });
      setRating(0);
      setText('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <FlatList
      testID={testIds.reviews.list}
      data={data ?? []}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={
        <View style={styles.formBlock}>
          <Text style={styles.heading} accessibilityRole="header">
            Leave a review
          </Text>
          {!isSignedIn ? (
            <Text style={styles.muted}>Sign in to leave a review.</Text>
          ) : (
            <>
              <StarRatingInput
                testID={testIds.reviews.ratingInput}
                value={rating}
                onChange={(n) => setRating(n)}
              />
              <View>
                <TextInput
                  testID={testIds.reviews.textInput}
                  accessibilityLabel="Review text"
                  value={text}
                  onChangeText={setText}
                  placeholder="What stood out?"
                  multiline
                  style={[styles.input, overLimit && styles.inputError]}
                />
                <Text
                  testID={testIds.reviews.charCount}
                  style={[styles.counter, overLimit && styles.counterError]}
                >
                  {remaining} characters left
                </Text>
              </View>
              {error && (
                <Text testID={testIds.reviews.errorMessage} style={styles.errorText}>
                  {error}
                </Text>
              )}
              <Button
                testID={testIds.reviews.submitButton}
                title={isPending ? 'Posting…' : 'Post review'}
                onPress={onSubmit}
                loading={isPending}
                disabled={!canSubmit}
              />
            </>
          )}
        </View>
      }
      renderItem={({ item }) => <ReviewRow review={item} />}
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.muted}>No reviews yet. Be the first.</Text>
          </View>
        )
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onRefresh={refetch}
      refreshing={isLoading}
      contentContainerStyle={styles.content}
      style={{ backgroundColor: theme.colors.background }}
    />
  );
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <View testID={testIds.reviews.item(review.id)} style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.author}>{review.authorName}</Text>
        <StarRatingInput value={review.rating} interactive={false} size={16} />
      </View>
      <Text style={styles.body}>{review.text}</Text>
      <Text style={styles.timestamp}>{relativeTime(review.createdAt)}</Text>
    </View>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < 60 * 1000) return 'just now';
  if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 1000))}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / (60 * 60 * 1000))}h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const styles = StyleSheet.create({
  content: { paddingVertical: theme.spacing.md },
  formBlock: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  heading: { fontSize: theme.typography.title, fontWeight: '700', color: theme.colors.text },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: theme.colors.danger },
  counter: { textAlign: 'right', fontSize: theme.typography.caption, color: theme.colors.muted },
  counterError: { color: theme.colors.danger },
  errorText: { fontSize: theme.typography.caption, color: theme.colors.danger },
  muted: { color: theme.colors.muted, fontSize: theme.typography.body },
  center: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  row: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, gap: 4 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: theme.typography.body, fontWeight: '600', color: theme.colors.text },
  body: { fontSize: theme.typography.body, color: theme.colors.text },
  timestamp: { fontSize: theme.typography.caption, color: theme.colors.muted },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
});
