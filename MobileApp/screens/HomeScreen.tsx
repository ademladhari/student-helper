import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AppCard from '../src/components/AppCard';
import { palette, radius, spacing, typography } from '../src/theme/tokens';
import { LearningGoal, StudyBlock, TaskItem } from '../src/types/study';

type Props = {
  tasks: TaskItem[];
  todayPlan: StudyBlock[];
  goal: LearningGoal;
  userName: string;
  onUpdateGoal: (goal: LearningGoal) => void;
  onOpenScan: () => void;
  onStartFocus: () => void;
};

function buildGreeting(userName: string) {
  const firstName = userName.trim().split(/\s+/)[0];
  if (!firstName || firstName.toLowerCase() === 'guest') {
    return 'Welcome back!';
  }
  return `Hello, ${firstName}!`;
}

export default function HomeScreen({
  tasks,
  todayPlan,
  goal,
  userName,
  onUpdateGoal,
  onOpenScan,
  onStartFocus,
}: Props) {
  const [goalTitle, setGoalTitle] = useState(goal.title || '');
  const [goalTaskCount, setGoalTaskCount] = useState(
    goal.targetTaskCount > 0 ? String(goal.targetTaskCount) : '',
  );
  const [goalTargetDate, setGoalTargetDate] = useState(() => {
    if (goal.targetDate) {
      const parsed = new Date(goal.targetDate);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  });
  const [showGoalDatePicker, setShowGoalDatePicker] = useState(false);

  useEffect(() => {
    setGoalTitle(goal.title || '');
    setGoalTaskCount(goal.targetTaskCount > 0 ? String(goal.targetTaskCount) : '');
    if (goal.targetDate) {
      const parsed = new Date(goal.targetDate);
      if (!Number.isNaN(parsed.getTime())) {
        setGoalTargetDate(parsed);
      }
    }
  }, [goal.title, goal.targetTaskCount, goal.targetDate]);

  const greeting = useMemo(() => buildGreeting(userName), [userName]);

  const goalTargetDateLabel = useMemo(
    () =>
      goalTargetDate.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [goalTargetDate],
  );

  function onGoalTargetDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowGoalDatePicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    setGoalTargetDate(selectedDate);
  }

  const upcoming = tasks
    .filter(task => task.status !== 'done')
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 3);

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
    if (!goal.targetTaskCount || goal.targetTaskCount < 1) {
      return null;
    }

    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const remainingTasks = Math.max(0, goal.targetTaskCount - completedTasks);
    const progress = Math.min(1, completedTasks / goal.targetTaskCount);
    const progressPercent = Math.round(progress * 100);

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const completedToday = tasks.filter(
      task =>
        task.status === 'done' &&
        task.completedAt &&
        new Date(task.completedAt) >= todayStart &&
        new Date(task.completedAt) < new Date(todayStart.getTime() + 86400000),
    ).length;

    let daysUntilTarget: number | null = null;
    if (goal.targetDate) {
      const targetStart = new Date(goal.targetDate);
      targetStart.setHours(0, 0, 0, 0);
      daysUntilTarget = Math.ceil((targetStart.getTime() - todayStart.getTime()) / 86400000);
    }

    return {
      completedTasks,
      remainingTasks,
      progressPercent,
      completedToday,
      reached: completedTasks >= goal.targetTaskCount,
      daysUntilTarget,
    };
  }, [goal.targetDate, goal.targetTaskCount, tasks]);

  function saveGoal() {
    const trimmedTitle = goalTitle.trim();
    const parsed = Number.parseInt(goalTaskCount, 10);

    if (!trimmedTitle) {
      return;
    }

    if (Number.isNaN(parsed) || parsed < 1) {
      return;
    }

    onUpdateGoal({
      title: trimmedTitle,
      targetTaskCount: parsed,
      targetDate: goalTargetDate.toISOString(),
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.introWrap}>
        <Text style={styles.greeting}>{greeting}</Text>
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
        <Text style={styles.sectionTitle}>Learning Goal</Text>
        <Text style={styles.muted}>Name your goal, set a target date, and choose how many tasks to complete.</Text>
        <TextInput
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="Goal title (e.g. Finish midterm prep)"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
        />
        <Pressable onPress={() => setShowGoalDatePicker(current => !current)} style={styles.dateField}>
          <Text style={styles.dateFieldLabel}>Target completion date</Text>
          <Text style={styles.dateFieldValue}>{goalTargetDateLabel}</Text>
        </Pressable>
        {showGoalDatePicker ? (
          <View style={styles.datePickerWrap}>
            <DateTimePicker
              value={goalTargetDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onGoalTargetDateChange}
            />
            {Platform.OS === 'ios' ? (
              <Pressable onPress={() => setShowGoalDatePicker(false)} style={styles.dateDoneButton}>
                <Text style={styles.dateDoneText}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <TextInput
          value={goalTaskCount}
          onChangeText={setGoalTaskCount}
          placeholder="Number of tasks to complete (e.g. 10)"
          placeholderTextColor={palette.textMuted}
          keyboardType="number-pad"
          style={styles.input}
        />
        <Pressable style={styles.secondaryButton} onPress={saveGoal}>
          <Text style={styles.secondaryButtonText}>Save Goal</Text>
        </Pressable>

        {goal.targetTaskCount > 0 && goal.title && goalStats ? (
          <View style={styles.goalSummary}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            {goal.targetDate ? (
              <Text style={styles.goalMeta}>
                Target date: {new Date(goal.targetDate).toLocaleDateString()}
                {goalStats.daysUntilTarget !== null
                  ? goalStats.daysUntilTarget > 0
                    ? ` · ${goalStats.daysUntilTarget} day${goalStats.daysUntilTarget === 1 ? '' : 's'} left`
                    : goalStats.daysUntilTarget === 0
                      ? ' · due today'
                      : ` · ${Math.abs(goalStats.daysUntilTarget)} day${Math.abs(goalStats.daysUntilTarget) === 1 ? '' : 's'} overdue`
                  : ''}
              </Text>
            ) : null}
            <Text style={styles.goalMeta}>
              Progress: {goalStats.completedTasks} of {goal.targetTaskCount} tasks ({goalStats.progressPercent}%)
            </Text>
            <View style={styles.goalProgressTrack}>
              <View style={[styles.goalProgressFill, { width: `${goalStats.progressPercent}%` }]} />
            </View>
            <Text style={styles.goalMeta}>Completed today: {goalStats.completedToday}</Text>
            <Text style={styles.goalMeta}>
              {goalStats.reached
                ? 'Goal reached — nice work!'
                : `${goalStats.remainingTasks} task${goalStats.remainingTasks === 1 ? '' : 's'} left`}
            </Text>
          </View>
        ) : (
          <Text style={styles.helperLine}>Set a title, date, and task count to start tracking.</Text>
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
  dateField: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#F9FBFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    marginBottom: spacing.sm,
  },
  dateFieldLabel: {
    color: palette.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  dateFieldValue: {
    color: palette.textStrong,
    fontSize: 15,
    fontWeight: '600',
  },
  datePickerWrap: {
    marginBottom: spacing.sm,
  },
  dateDoneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dateDoneText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 14,
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
  goalProgressTrack: {
    height: 10,
    borderRadius: radius.round,
    backgroundColor: '#D4DEED',
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: radius.round,
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
