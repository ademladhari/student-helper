import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../src/components/AppCard';
import { palette, spacing, typography } from '../src/theme/tokens';

type Props = {
  done: number;
  drafts: number;
  pending: number;
  totalPomodorosPlanned: number;
  totalPomodorosDone: number;
};

export default function StatsScreen({
  done,
  drafts,
  pending,
  totalPomodorosDone,
  totalPomodorosPlanned,
}: Props) {
  const completion = totalPomodorosPlanned === 0 ? 0 : Math.round((totalPomodorosDone / totalPomodorosPlanned) * 100);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppCard soft>
        <Text style={styles.heading}>Study Statistics</Text>
        <Text style={styles.subtitle}>Track output from AI plans and real completed sessions.</Text>
      </AppCard>

      <View style={styles.grid}>
        <AppCard>
          <Text style={styles.metricLabel}>Completed Tasks</Text>
          <Text style={styles.metricValue}>{done}</Text>
        </AppCard>
        <AppCard>
          <Text style={styles.metricLabel}>Pending Tasks</Text>
          <Text style={styles.metricValue}>{pending}</Text>
        </AppCard>
      </View>

      <View style={styles.grid}>
        <AppCard>
          <Text style={styles.metricLabel}>Draft Tasks</Text>
          <Text style={styles.metricValue}>{drafts}</Text>
        </AppCard>
        <AppCard>
          <Text style={styles.metricLabel}>Pomodoro Progress</Text>
          <Text style={styles.metricValue}>{completion}%</Text>
        </AppCard>
      </View>

      <AppCard>
        <Text style={styles.metricLabel}>Pomodoro Sessions</Text>
        <Text style={styles.detail}>
          Planned: {totalPomodorosPlanned} • Completed: {totalPomodorosDone}
        </Text>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heading: {
    fontSize: typography.section,
    fontWeight: '700',
    color: palette.textStrong,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typography.body,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricLabel: {
    color: palette.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  metricValue: {
    color: palette.textStrong,
    fontSize: 28,
    fontWeight: '700',
  },
  detail: {
    color: palette.textStrong,
    fontSize: typography.body,
  },
});
