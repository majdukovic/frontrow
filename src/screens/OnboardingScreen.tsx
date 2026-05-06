import { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { Button } from '../components/Button';
import { useSettingsStore } from '../state/settings';

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: 'musical-notes',
    title: 'Discover live music',
    body: 'Browse upcoming shows from independent artists and venues you love.',
  },
  {
    icon: 'ticket',
    title: 'Buy tickets in seconds',
    body: 'Pay with cards or wallets. Your QR is in My Tickets the moment checkout finishes.',
  },
  {
    icon: 'people',
    title: 'Bring a friend',
    body: 'Transfer tickets to anyone with a FrontRow account. Manage refunds from the app.',
  },
];

export function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const finishOnboarding = useSettingsStore((s) => s.finishOnboarding);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  };

  const goNext = () => {
    if (page < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true });
    } else {
      void finishOnboarding();
    }
  };

  const skip = () => {
    void finishOnboarding();
  };

  const isLast = page === SLIDES.length - 1;

  return (
    <View style={styles.root} testID={testIds.onboarding.screen}>
      <View style={styles.header}>
        <Pressable
          testID={testIds.onboarding.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          onPress={skip}
          hitSlop={12}
        >
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.pager}
      >
        {SLIDES.map((slide, i) => (
          <View
            key={slide.title}
            style={[styles.slide, { width }]}
            testID={testIds.onboarding.page(i)}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={slide.icon} size={64} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            testID={testIds.onboarding.dot(i)}
            style={[styles.dot, i === page && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          testID={isLast ? testIds.onboarding.getStartedButton : testIds.onboarding.nextButton}
          title={isLast ? 'Get started' : 'Next'}
          onPress={goNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  skip: { fontSize: theme.typography.body, color: theme.colors.muted, padding: theme.spacing.xs },
  pager: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: { backgroundColor: theme.colors.primary, width: 24 },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
});
