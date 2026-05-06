import { View, Text, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { Button } from '../components/Button';
import { useAuthStore } from '../state/auth';
import { useLogout } from '../hooks/useAuth';
import type { ProfileStackParamList } from '../navigation/types';

export function ProfileScreen() {
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending: loggingOut } = useLogout();

  if (!user) {
    return (
      <View style={styles.container} testID={testIds.profile.screen}>
        <Text style={styles.heading} accessibilityRole="header">
          Sign in
        </Text>
        <Text style={styles.body}>Sign in to manage your account and tickets.</Text>
        <Button
          testID={testIds.profile.signInButton}
          title="Sign in"
          onPress={() => nav.navigate('Login')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testIds.profile.screen}>
      {user.avatarUrl ? (
        <Image
          testID={testIds.profile.avatar}
          source={{ uri: user.avatarUrl }}
          style={styles.avatar}
          accessible={false}
        />
      ) : (
        <View testID={testIds.profile.avatar} style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarLetter}>{user.displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.heading} accessibilityRole="header">
        {user.displayName}
      </Text>
      <Text style={styles.body}>{user.email}</Text>
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      <Button
        testID={testIds.profile.editButton}
        title="Edit profile"
        variant="secondary"
        onPress={() => nav.navigate('EditProfile')}
      />
      <Button
        testID="profile.followingButton"
        title="Following"
        variant="secondary"
        onPress={() => nav.navigate('Following')}
      />
      <Button
        testID="profile.premiumButton"
        title="Premium"
        variant="secondary"
        onPress={() => nav.navigate('Premium')}
      />
      <Button
        testID="profile.settingsButton"
        title="Settings"
        variant="secondary"
        onPress={() => nav.navigate('Settings')}
      />
      <Button
        testID={testIds.profile.signOutButton}
        title={loggingOut ? 'Signing out…' : 'Sign out'}
        variant="secondary"
        loading={loggingOut}
        onPress={() => logout()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: theme.colors.surface },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarLetter: { fontSize: 36, fontWeight: '700', color: theme.colors.text },
  heading: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  body: { fontSize: theme.typography.body, color: theme.colors.muted, textAlign: 'center' },
  bio: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
});
