import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppCard from '../src/components/AppCard';
import { palette, radius, spacing, typography } from '../src/theme/tokens';
import { StudyBlock, TaskItem } from '../src/types/study';

type LearningGoal = {
  title: string;
  targetDate: string;
};

type Props = {
  tasks: TaskItem[];
  todayPlan: StudyBlock[];
  goal: LearningGoal;
  onUpdateGoal: (goal: LearningGoal) => void;
  onOpenScan: () => void;
  onStartFocus: () => void;
};

export default function HomeScreen({ tasks, todayPlan, goal, onUpdateGoal, onOpenScan, onStartFocus }: Props) {
  const [goalTitle, setGoalTitle] = useState(goal.title);
  const [goalDate, setGoalDate] = useState(goal.targetDate);

  useEffect(() => {
    setGoalTitle(goal.title);
    setGoalDate(goal.targetDate);
  }, [goal.title, goal.targetDate]);

  const upcoming = tasks
    .filter(task => task.status !== 'done')
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 3);

  const completedCount = tasks.filter(task => task.status === 'done').length;
  const totalPomodorosPlanned = tasks.reduce((sum, task) => sum + task.estimatedPomodoros, 0);
  const totalPomodorosDone = tasks
    .filter(task => task.status === 'done')
    .reduce((sum, task) => sum + task.estimatedPomodoros, 0);
  const progress = totalPomodorosPlanned === 0 ? 0 : totalPomodorosDone / totalPomodorosPlanned;
  const progressPercent = Math.round(progress * 100);
  const progressWidth = `${progressPercent}%`;
  const plannedHours = totalPomodorosPlanned === 0 ? 0 : (totalPomodorosPlanned * 25) / 60;
  const completedHours = totalPomodorosDone === 0 ? 0 : (totalPomodorosDone * 25) / 60;

  const goalStats = useMemo(() => {
    if (!goal.targetDate) {
      return null;
    }

    const target = new Date(goal.targetDate);
    if (Number.isNaN(target.getTime())) {
      return null;
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const totalDays = Math.max(1, Math.ceil((targetStart.getTime() - todayStart.getTime()) / 86400000) + 1);

    const remainingPomodoros = tasks
      .filter(task => task.status !== 'done')
      .reduce((sum, task) => sum + task.estimatedPomodoros, 0);

    const dailyTarget = totalDays <= 0 ? 0 : Math.max(1, Math.ceil(remainingPomodoros / totalDays));

    const completedToday = tasks
      .filter(task => task.status === 'done' && task.completedAt)
      .filter(task => {
        if (!task.completedAt) {
          return false;
        }
        const completedDate = new Date(task.completedAt);
        return completedDate >= todayStart && completedDate < new Date(todayStart.getTime() + 86400000);
      })
      .reduce((sum, task) => sum + task.estimatedPomodoros, 0);

    const totalPlanned = tasks.reduce((sum, task) => sum + task.estimatedPomodoros, 0);
    const elapsedDays = Math.max(1, Math.ceil((todayStart.getTime() - Math.min(todayStart.getTime(), targetStart.getTime())) / 86400000) + 1);
    const expectedByNow = totalPlanned === 0 ? 0 : Math.ceil((totalPlanned / (elapsedDays + totalDays - 1)) * elapsedDays);
    const behind = totalPomodorosDone < expectedByNow;

    return {
      totalDays,
      remainingPomodoros,
      dailyTarget,
      completedToday,
      behind,
    };
  }, [goal.targetDate, tasks, totalPomodorosDone]);

  function saveGoal() {
    const title = goalTitle.trim();
    const targetDate = goalDate.trim();

    if (!title || !targetDate) {
      return;
    }

    const parsed = new Date(targetDate);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }

    onUpdateGoal({ title, targetDate });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.introWrap}>
        <Text style={styles.greeting}>Czesc, Alex!</Text>
        <Text style={styles.subtitle}>Ready to master your sessions today? Let us dive in.</Text>
      </View>

      <AppCard>
        <View style={styles.focusTag}>
          <Text style={styles.focusTagText}>DEEP FOCUS</Text>
        </View>

        <Text style={styles.heroTitle}>Start a Pomodoro Session</Text>
        <Text style={styles.heroText}>
          Use high-intensity focus followed by a short break.
        </Text>

        <Pressable style={styles.primaryCta} onPress={onStartFocus}>
          <Text style={styles.primaryCtaText}>Start Focus Now</Text>
        </Pressable>
      </AppCard>

      <AppCard soft>
        <View style={styles.rowSpace}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <Text style={styles.plusBadge}>{progressPercent}%</Text>
        </View>
        <View style={styles.rowSpace}>
          <Text style={styles.mutedLabel}>Planned: {plannedHours.toFixed(1)} hrs</Text>
          <Text style={styles.mutedLabel}>Completed: {completedHours.toFixed(1)} hrs</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.helperLine}>Based on estimated pomodoros from your tasks.</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Goal-Based Learning</Text>
        <Text style={styles.muted}>Set a learning goal and the app will pace your daily workload.</Text>
        <TextInput
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="Goal title (e.g. Pass exam in 30 days)"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
        />
        <TextInput
          value={goalDate}
          onChangeText={setGoalDate}
          placeholder="Target date (YYYY-MM-DD)"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
        />
        <Pressable style={styles.secondaryButton} onPress={saveGoal}>
          <Text style={styles.secondaryButtonText}>Save Goal</Text>
        </Pressable>

        {goal.title && goalStats ? (
          <View style={styles.goalSummary}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalMeta}>Days left: {goalStats.totalDays}</Text>
            <Text style={styles.goalMeta}>Daily target: {goalStats.dailyTarget} pomodoros</Text>
            <Text style={styles.goalMeta}>Completed today: {goalStats.completedToday}</Text>
            <Text style={goalStats.behind ? styles.goalBehind : styles.goalOnTrack}>
              {goalStats.behind ? 'You are behind pace. Daily target recalculated.' : 'You are on track.'}
            </Text>
          </View>
        ) : (
          <Text style={styles.helperLine}>Add a goal and target date to start tracking.</Text>
        )}
      </AppCard>

      <AppCard soft>
        <View style={styles.rowSpace}>
          <Text style={styles.sectionTitle}>Recent Tasks</Text>
          <Text style={styles.linkText}>View All</Text>
        </View>
        {upcoming.length === 0 ? <Text style={styles.muted}>No tasks yet.</Text> : null}
        {upcoming.map(task => (
          <View key={task.id} style={styles.taskTile}>
            <View style={styles.taskIcon}>
              <Text style={styles.taskIconText}>Q</Text>
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskMeta}>Due {new Date(task.dueDate).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.arrow}>{'>'}</Text>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <View style={styles.digitizeCard}>
          <Text style={styles.digitizeTitle}>Digitize your Notes</Text>
          <Text style={styles.digitizeText}>
            Scan handwritten notes and convert them into searchable study material.
          </Text>
          <Pressable style={styles.openScannerButton} onPress={onOpenScan}>
            <Text style={styles.openScannerText}>Open Scanner</Text>
          </Pressable>
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Today Plan Blocks</Text>
        {todayPlan.length === 0 ? <Text style={styles.muted}>Generate tasks from scan to build plan.</Text> : null}
        {todayPlan.map(block => (
          <View key={block.title} style={styles.planRow}>
            <Text style={styles.taskTitle}>{block.title}</Text>
            <Text style={styles.muted}>{block.pomodoros}x Pomodoro ({block.minutes}m)</Text>
          </View>
        ))}
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  introWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  greeting: {
    fontSize: 46,
    fontWeight: '700',
    color: palette.textStrong,
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 17,
    color: palette.textMuted,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  focusTag: {
    alignSelf: 'flex-start',
    borderRadius: radius.round,
    backgroundColor: palette.primarySoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
  },
  focusTagText: {
    color: palette.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  heroTitle: {
    color: palette.textStrong,
    fontSize: 54,
    lineHeight: 60,
    fontWeight: '700',
    letterSpacing: -1.1,
    marginBottom: spacing.md,
  },
  heroText: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  primaryCta: {
    alignSelf: 'flex-start',
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#4D61CA',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginBottom: spacing.lg,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#F9FBFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    color: palette.textStrong,
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.sm,
  },
  secondaryButtonText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  goalSummary: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#F3F7FF',
    borderWidth: 1,
    borderColor: palette.border,
    gap: 4,
  },
  goalTitle: {
    color: palette.textStrong,
    fontWeight: '700',
    fontSize: 16,
  },
  goalMeta: {
    color: palette.textMuted,
    fontSize: 13,
  },
  goalBehind: {
    color: palette.warning,
    fontWeight: '700',
    marginTop: 4,
  },
  goalOnTrack: {
    color: palette.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  rowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textStrong,
    letterSpacing: -0.5,
  },
  plusBadge: {
    backgroundColor: '#F8E7CA',
    color: palette.warning,
    borderRadius: radius.sm,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mutedLabel: {
    color: palette.textStrong,
    fontSize: typography.body,
  },
  progressTrack: {
    height: 14,
    borderRadius: radius.round,
    backgroundColor: '#D4DEED',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A06A14',
    borderRadius: radius.round,
  },
  helperLine: {
    color: palette.textMuted,
    fontSize: 13,
  },
  linkText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  taskTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBEEF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  taskIconText: {
    color: palette.primary,
    fontWeight: '700',
  },
  taskInfo: {
    flex: 1,
  },
  taskMeta: {
    color: palette.textMuted,
    fontSize: 13,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textStrong,
  },
  arrow: {
    color: '#A9B8CF',
    fontSize: 20,
    fontWeight: '700',
  },
  digitizeCard: {
    backgroundColor: palette.mint,
    borderRadius: radius.lg,
    padding: spacing.lg,
    margin: -6,
  },
  digitizeTitle: {
    color: '#0C5B63',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: spacing.sm,
  },
  digitizeText: {
    color: '#216A72',
    fontSize: typography.body,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  openScannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0A7D7A',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radius.md,
  },
  openScannerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  planRow: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  muted: {
    color: palette.textMuted,
    fontSize: typography.body,
  },
});
