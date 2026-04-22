import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, radius, spacing } from '../theme/tokens';

type Props = {
  children: ReactNode;
  soft?: boolean;
};

export default function AppCard({ children, soft = false }: Props) {
  return <View style={[styles.card, soft && styles.soft]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.md,
    shadowColor: palette.shadow,
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  soft: {
    backgroundColor: palette.surfaceSoft,
  },
});
