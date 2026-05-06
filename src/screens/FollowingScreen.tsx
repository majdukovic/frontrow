import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { EmptyState } from '../components/EmptyState';
import { useFollowedArtists, useToggleFollowArtist } from '../hooks/useArtists';
import { showToast } from '../state/toasts';

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k followers`;
  return `${n} followers`;
}

export function FollowingScreen() {
  const { data, isLoading, error } = useFollowedArtists();
  const toggle = useToggleFollowArtist();

  if (isLoading) {
    return (
      <View style={styles.center} testID={testIds.following.screen}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center} testID={testIds.following.screen}>
        <Text style={styles.error}>Failed to load.</Text>
      </View>
    );
  }

  const onUnfollow = async (artistId: string) => {
    try {
      await toggle.mutateAsync({ artistId, follow: false });
      showToast('Unfollowed', 'info');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  return (
    <View style={styles.container} testID={testIds.following.screen}>
      <FlatList
        testID={testIds.following.list}
        data={data ?? []}
        keyExtractor={(a) => a.id}
        contentContainerStyle={
          data && data.length > 0 ? { paddingVertical: theme.spacing.sm } : styles.emptyContent
        }
        renderItem={({ item }) => (
          <View testID={testIds.following.item(item.id)} style={styles.row}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} accessible={false} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.body}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.genres.join(' · ')} · {formatFollowers(item.followers)}
              </Text>
            </View>
            <Pressable
              testID={testIds.following.unfollowButton(item.id)}
              accessibilityRole="button"
              onPress={() => void onUnfollow(item.id)}
              hitSlop={8}
              style={styles.unfollowButton}
            >
              <Text style={styles.unfollowText}>Unfollow</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            testID={testIds.following.emptyState}
            icon="people-outline"
            title="No artists followed yet"
            body="Tap the follow button on any event to track an artist's upcoming shows."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  emptyContent: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 22, fontWeight: '700', color: theme.colors.muted },
  body: { flex: 1 },
  name: { fontSize: theme.typography.body, fontWeight: '600', color: theme.colors.text },
  meta: { fontSize: theme.typography.caption, color: theme.colors.muted, marginTop: 2 },
  unfollowButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unfollowText: { fontSize: theme.typography.caption, fontWeight: '600', color: theme.colors.text },
  error: { color: theme.colors.danger, fontSize: theme.typography.body },
});
