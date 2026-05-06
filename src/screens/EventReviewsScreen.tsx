import { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading, isRefetching, refetch } = useReviewsForEvent(eventId);
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
      await mutateAsync({
        rating: rating as 1 | 2 | 3 | 4 | 5,
        text,
        imageUri: imageUri ?? undefined,
      });
      setRating(0);
      setText('');
      setImageUri(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onPickImage = async () => {
    setPermissionDenied(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPermissionDenied(true);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled) return;
    const first = result.assets?.[0];
    if (first?.uri) setImageUri(first.uri);
  };

  return (
    <FlatList
      testID={testIds.reviews.list}
      data={data ?? []}
      keyExtractor={(r) => r.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
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
              {imageUri ? (
                <View style={styles.previewBlock}>
                  <Image
                    testID={testIds.reviews.imagePreview}
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                    accessibilityLabel="Selected review photo preview"
                  />
                  <Pressable
                    testID={testIds.reviews.removeImageButton}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                    onPress={() => setImageUri(null)}
                    style={styles.previewRemove}
                  >
                    <Ionicons name="close" size={16} color={theme.colors.primaryText} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  testID={testIds.reviews.pickImageButton}
                  accessibilityRole="button"
                  accessibilityLabel="Attach a photo"
                  onPress={() => void onPickImage()}
                  style={styles.pickButton}
                >
                  <Ionicons name="image-outline" size={18} color={theme.colors.primary} />
                  <Text style={styles.pickButtonText}>Attach photo</Text>
                </Pressable>
              )}
              {permissionDenied ? (
                <Text testID={testIds.reviews.permissionDenied} style={styles.errorText}>
                  Photo library access denied. Enable it in Settings to attach a photo.
                </Text>
              ) : null}
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
      {review.text ? <Text style={styles.body}>{review.text}</Text> : null}
      {review.imageUri ? (
        <Image
          testID={testIds.reviews.itemImage(review.id)}
          source={{ uri: review.imageUri }}
          style={styles.attachedImage}
          accessibilityLabel="Photo attached to review"
        />
      ) : null}
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
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pickButtonText: { fontSize: theme.typography.body, color: theme.colors.primary, fontWeight: '600' },
  previewBlock: { position: 'relative', alignSelf: 'flex-start' },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  previewRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachedImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.xs,
  },
});
