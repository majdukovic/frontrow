import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';

type Props = {
  value: number;
  onChange?: (n: 1 | 2 | 3 | 4 | 5) => void;
  size?: number;
  testID?: string;
  /** When false, renders read-only stars without press handlers. */
  interactive?: boolean;
};

export function StarRatingInput({
  value,
  onChange,
  size = 32,
  testID,
  interactive = true,
}: Props) {
  return (
    <View testID={testID} accessibilityLabel={`${value} of 5 stars`} style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const star = (
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? theme.colors.warning : theme.colors.muted}
          />
        );
        if (!interactive) {
          return (
            <View key={n} style={styles.star}>
              {star}
            </View>
          );
        }
        return (
          <Pressable
            key={n}
            testID={testID ? `${testID}.star.${n}` : undefined}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
            hitSlop={8}
            onPress={() => onChange?.(n as 1 | 2 | 3 | 4 | 5)}
            style={styles.star}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  star: { padding: 2 },
});
