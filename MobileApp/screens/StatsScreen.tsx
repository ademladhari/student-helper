import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../src/components/AppCard';
import { palette, radius, spacing, typography } from '../src/theme/tokens';

type Props = {
  done: number;
  drafts: number;
  pending: number;
  totalPomodorosPlanned: number;
  totalPomodorosDone: number;
  dailyStreak: number;
};

export default function StatsScreen({
  done,
  drafts,
  pending,
  totalPomodorosDone,
  totalPomodorosPlanned,
  dailyStreak,
}: Props) {
  const completion =
    totalPomodorosPlanned === 0 ? 0 : Math.round((totalPomodorosDone / totalPomodorosPlanned) * 100);
  const totalTasks = done + pending + drafts;
  const taskCompletion = totalTasks === 0 ? 0 : Math.round((done / totalTasks) * 100);
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const streakTarget = 7;
  const streakProgress = Math.min(dailyStreak, streakTarget);
  const streakPercent = Math.round((streakProgress / streakTarget) * 100);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.backgroundBlobTop} />
      <View style={styles.backgroundBlobBottom} />

      <AppCard soft>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heading}>Study Momentum</Text>
            <Text style={styles.subtitle}>Live glance at tasks, streaks, and sessions.</Text>
          </View>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>{taskCompletion}% complete</Text>
          </View>
        </View>
      </AppCard>

      <View style={styles.grid}>
        <AppCard>
          <Text style={styles.metricLabel}>Completed Tasks</Text>
          <Text style={styles.metricValue}>{done}</Text>
          <Text style={styles.metricHelper}>Out of {totalTasks || 0} total</Text>
        </AppCard>
        <AppCard>
          <Text style={styles.metricLabel}>Pending Tasks</Text>
          <Text style={styles.metricValue}>{pending}</Text>
          <Text style={styles.metricHelper}>Drafts: {drafts}</Text>
        </AppCard>
      </View>

      <AppCard>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <Text style={styles.sectionMeta}>Target {streakTarget} days</Text>
        </View>
        <View style={styles.streakRow}>
          <Text style={styles.streakValue}>{dailyStreak}</Text>
          <View>
            <Text style={styles.streakLabel}>Day streak</Text>
            <Text style={styles.streakHelper}>{streakPercent}% to weekly goal</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${streakPercent}%` }]} />
        </View>
        <View style={styles.weekRow}>
          {weekDays.map((day, index) => {
            const isActive = index < streakProgress;
            return (
              <View key={`${day}-${index}`} style={[styles.weekPill, isActive && styles.weekPillActive]}>
                <Text style={[styles.weekPillText, isActive && styles.weekPillTextActive]}>{day}</Text>
              </View>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pomodoro Progress</Text>
          <Text style={styles.sectionMeta}>{completion}% done</Text>
        </View>
        <Text style={styles.detail}>Planned: {totalPomodorosPlanned} • Completed: {totalPomodorosDone}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completion}%` }]} />
        </View>
        <View style={styles.splitRow}>
          <View>
            <Text style={styles.splitLabel}>This week</Text>
            <Text style={styles.splitValue}>{Math.min(totalPomodorosDone, 12)}</Text>
          </View>
          <View>
            <Text style={styles.splitLabel}>Next milestone</Text>
            <Text style={styles.splitValue}>{totalPomodorosPlanned + 4}</Text>
          </View>
          <View>
            <Text style={styles.splitLabel}>Focus score</Text>
            <Text style={styles.splitValue}>{Math.min(100, completion + 12)}%</Text>
          </View>
        </View>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: palette.background,
  },
  backgroundBlobTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(72,97,216,0.12)',
  },
  backgroundBlobBottom: {
    position: 'absolute',
    bottom: 120,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(35,184,154,0.12)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
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
  headerPill: {
    backgroundColor: palette.surface,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: palette.border,
  },
  headerPillText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: palette.textStrong,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionMeta: {
    color: palette.textMuted,
    fontSize: 12,
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
  metricHelper: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  streakValue: {
    fontSize: 40,
    fontWeight: '800',
    color: palette.primary,
  },
  streakLabel: {
    color: palette.textStrong,
    fontWeight: '700',
    fontSize: 16,
  },
  streakHelper: {
    color: palette.textMuted,
    fontSize: 12,
  },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: palette.surfaceMuted,
    overflow: 'hidden',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: 6,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  weekPill: {
    flex: 1,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  weekPillActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  weekPillText: {
    fontSize: 11,
    color: palette.textMuted,
    fontWeight: '700',
  },
  weekPillTextActive: {
    color: '#FFFFFF',
  },
  detail: {
    color: palette.textStrong,
    fontSize: typography.body,
    marginBottom: spacing.sm,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  splitLabel: {
    color: palette.textMuted,
    fontSize: 12,
  },
  splitValue: {
    color: palette.textStrong,
    fontWeight: '700',
    fontSize: 16,
  },
});
