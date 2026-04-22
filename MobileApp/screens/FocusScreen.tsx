import React, { useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppCard from '../src/components/AppCard';
import { palette, radius, spacing, typography } from '../src/theme/tokens';
import { FocusSessionState, TaskDraftInput, TaskItem } from '../src/types/study';

type Props = {
  tasks: TaskItem[];
  focusSession: FocusSessionState;
  setFocusSession: React.Dispatch<React.SetStateAction<FocusSessionState>>;
  onAddTask: (task: TaskDraftInput) => TaskItem | void;
  onBack: () => void;
};

const sessionOptions = [25, 90] as const;
const POMODORO_MINUTES = 25;
const BREAK_MINUTES_BY_SESSION: Record<(typeof sessionOptions)[number], number> = {
  25: 5,
  90: 15,
};

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safeSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export default function FocusScreen({ tasks, focusSession, setFocusSession, onAddTask, onBack }: Props) {
  const {
    sessionMinutes,
    secondsLeft,
    isPaused,
    phase,
    showTaskPicker,
    showQuickAdd,
    blockTasks,
    quickTaskTitle,
    quickTaskPomodoros,
  } = focusSession;

  const activeTasks = useMemo(() => tasks.filter(task => task.status !== 'done'), [tasks]);

  const availableTasks = useMemo(
    () => activeTasks.filter(task => !blockTasks.some(blockTask => blockTask.id === task.id)),
    [activeTasks, blockTasks],
  );

  const totalPlanPomodoros = blockTasks.reduce((sum, task) => sum + task.remainingPomodoros, 0);

  useEffect(() => {
    if (secondsLeft <= 0 || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setFocusSession(current => ({
        ...current,
        secondsLeft: Math.max(0, current.secondsLeft - 1),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, isPaused, setFocusSession]);

  useEffect(() => {
    if (secondsLeft > 0) {
      return;
    }

    if (phase === 'focus') {
      setFocusSession(current => {
        if (current.blockTasks.length === 0) {
          return {
            ...current,
            phase: 'break',
            secondsLeft: BREAK_MINUTES_BY_SESSION[current.sessionMinutes] * 60,
            isPaused: false,
          };
        }

        const [firstTask, ...rest] = current.blockTasks;
        const nextRemaining = firstTask.remainingPomodoros - 1;

        return {
          ...current,
          blockTasks:
            nextRemaining > 0
              ? [{ ...firstTask, remainingPomodoros: nextRemaining }, ...rest]
              : rest,
          phase: 'break',
          secondsLeft: BREAK_MINUTES_BY_SESSION[current.sessionMinutes] * 60,
          isPaused: false,
        };
      });

      return;
    }

    setFocusSession(current => ({
      ...current,
      phase: 'focus',
      secondsLeft: current.sessionMinutes * 60,
      isPaused: false,
    }));
  }, [phase, secondsLeft, setFocusSession]);

  function resetTimer() {
    setFocusSession(current => ({
      ...current,
      phase: 'focus',
      secondsLeft: current.sessionMinutes * 60,
      isPaused: false,
    }));
  }

  function selectSessionMinutes(nextMinutes: (typeof sessionOptions)[number]) {
    setFocusSession(current => ({
      ...current,
      sessionMinutes: nextMinutes,
      secondsLeft: nextMinutes * 60,
      phase: 'focus',
      isPaused: false,
    }));
  }

  function addTaskToBlock(taskId: string) {
    const selectedTask = activeTasks.find(task => task.id === taskId);

    if (!selectedTask) {
      return;
    }

    setFocusSession(current => {
      if (current.blockTasks.some(task => task.id === taskId)) {
        return current;
      }

      return {
        ...current,
        blockTasks: [
          ...current.blockTasks,
          {
            id: selectedTask.id,
            title: selectedTask.title,
            remainingPomodoros: selectedTask.estimatedPomodoros,
          },
        ],
      };
    });
  }

  function removeTaskFromBlock(taskId: string) {
    setFocusSession(current => ({
      ...current,
      blockTasks: current.blockTasks.filter(task => task.id !== taskId),
    }));
  }

  function addQuickTask() {
    const title = quickTaskTitle.trim();

    if (!title) {
      Alert.alert('Missing task title', 'Enter a name for the task.');
      return;
    }

    const parsedPomodoros = Number.parseInt(quickTaskPomodoros, 10);
    const safePomodoros = Number.isNaN(parsedPomodoros) ? 1 : Math.max(1, parsedPomodoros);

    const createdTask = onAddTask({
      title,
      dueDate: new Date().toISOString(),
      estimatedPomodoros: safePomodoros,
    });

    if (createdTask) {
      setFocusSession(current => ({
        ...current,
        blockTasks: current.blockTasks.some(task => task.id === createdTask.id)
          ? current.blockTasks
          : [
              ...current.blockTasks,
              {
                id: createdTask.id,
                title: createdTask.title,
                remainingPomodoros: createdTask.estimatedPomodoros,
              },
            ],
      }));
    }

    setFocusSession(current => ({
      ...current,
      quickTaskTitle: '',
      quickTaskPomodoros: '1',
      showQuickAdd: false,
    }));
  }

  function getPhaseLabel() {
    return phase === 'focus'
      ? `${sessionMinutes}m block · ${BREAK_MINUTES_BY_SESSION[sessionMinutes]}m pause`
      : `${BREAK_MINUTES_BY_SESSION[sessionMinutes]}m pause`;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppCard soft>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.kicker}>FOCUS MODE</Text>
            <Text style={styles.heading}>Session running</Text>
          </View>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Track the time left and work through the tasks planned for this block.
        </Text>
      </AppCard>

      <AppCard>
        <View style={styles.timerShell}>
          <View style={styles.timerRing}>
            <Text style={styles.timerValue}>{formatTime(secondsLeft)}</Text>
            <Text style={styles.timerLabel}>{getPhaseLabel()}</Text>
            {isPaused ? <Text style={styles.pausedLabel}>Paused</Text> : null}
          </View>
        </View>

        <View style={styles.optionRow}>
          {sessionOptions.map(option => {
            const active = option === sessionMinutes;

            return (
              <Pressable
                key={option}
                onPress={() => selectSessionMinutes(option)}
                style={[styles.optionPill, active && styles.optionPillActive]}>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{option} min</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.controlRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => setFocusSession(current => ({ ...current, isPaused: !current.isPaused }))}>
            <Text style={styles.secondaryButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={resetTimer}>
            <Text style={styles.secondaryButtonText}>Restart</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={onBack}>
          <Text style={styles.primaryButtonText}>Leave Focus</Text>
        </Pressable>
      </AppCard>

      <AppCard soft>
        <View style={styles.rowSpace}>
          <Text style={styles.sectionTitle}>Tasks for this block</Text>
          <Text style={styles.muted}>{totalPlanPomodoros}x Pomodoro planned</Text>
        </View>
        {blockTasks.length === 0 ? <Text style={styles.empty}>Pick tasks from your list below.</Text> : null}
        {blockTasks.map(task => (
          <View key={task.id} style={styles.taskRow}>
            <View style={styles.taskCountPill}>
              <Text style={styles.taskCountText}>{task.remainingPomodoros}x</Text>
            </View>
            <View style={styles.taskDot} />
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskMeta}>{task.remainingPomodoros * POMODORO_MINUTES} minutes remaining</Text>
            </View>
            <Pressable onPress={() => removeTaskFromBlock(task.id)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        ))}
      </AppCard>

      <AppCard soft>
        <Pressable
          style={styles.togglePickerButton}
          onPress={() => setFocusSession(current => ({ ...current, showTaskPicker: !current.showTaskPicker }))}>
          <Text style={styles.togglePickerText}>{showTaskPicker ? 'Hide task picker' : 'Add from task list'}</Text>
        </Pressable>

        {showTaskPicker ? (
          <View style={styles.pickerWrap}>
            <View style={styles.rowSpace}>
              <Text style={styles.sectionTitle}>Your task list</Text>
              <Text style={styles.muted}>{availableTasks.length} available</Text>
            </View>
            {availableTasks.length === 0 ? <Text style={styles.empty}>No available tasks right now.</Text> : null}
            {availableTasks.map(task => (
              <View key={task.id} style={styles.taskRow}>
                <View style={styles.taskCountPill}>
                  <Text style={styles.taskCountText}>{task.estimatedPomodoros}x</Text>
                </View>
                <View style={styles.taskDot} />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>{task.estimatedPomodoros * POMODORO_MINUTES} minutes planned</Text>
                </View>
                <Pressable onPress={() => addTaskToBlock(task.id)} style={styles.addExistingButton}>
                  <Text style={styles.addExistingButtonText}>Add</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          style={styles.togglePickerButton}
          onPress={() => setFocusSession(current => ({ ...current, showQuickAdd: !current.showQuickAdd }))}>
          <Text style={styles.togglePickerText}>{showQuickAdd ? 'Hide quick add' : 'Add on your own'}</Text>
        </Pressable>

        {showQuickAdd ? (
          <View style={styles.pickerWrap}>
            <Text style={styles.blockHint}>
              Create a quick task for this block and it will be added to your task list too.
            </Text>
            <TextInput
              value={quickTaskTitle}
              onChangeText={text => setFocusSession(current => ({ ...current, quickTaskTitle: text }))}
              placeholder="Task title"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
            />
            <TextInput
              value={quickTaskPomodoros}
              onChangeText={text => setFocusSession(current => ({ ...current, quickTaskPomodoros: text }))}
              placeholder="Pomodoros"
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
            <Pressable style={styles.quickAddButton} onPress={addQuickTask}>
              <Text style={styles.quickAddButtonText}>Add Task</Text>
            </Pressable>
          </View>
        ) : null}
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  kicker: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heading: {
    fontSize: 30,
    lineHeight: 34,
    color: palette.textStrong,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: radius.round,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  backButtonText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  timerShell: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timerRing: {
    width: 240,
    height: 240,
    borderRadius: radius.round,
    backgroundColor: '#E9F7F6',
    borderWidth: 3,
    borderColor: '#C9D8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerValue: {
    fontSize: 54,
    lineHeight: 60,
    fontWeight: '700',
    color: palette.primary,
    letterSpacing: -1.4,
  },
  timerLabel: {
    marginTop: 6,
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  pausedLabel: {
    marginTop: 8,
    color: palette.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  optionPill: {
    borderRadius: radius.round,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  optionPillActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  optionText: {
    color: palette.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  controlRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: palette.accent,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
  },
  muted: {
    fontSize: 12,
    color: palette.textMuted,
  },
  empty: {
    color: palette.textMuted,
    fontSize: typography.body,
  },
  togglePickerButton: {
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  togglePickerText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  pickerWrap: {
    marginTop: spacing.sm,
  },
  blockHint: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: spacing.md,
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
  quickAddButton: {
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  taskDot: {
    width: 10,
    height: 10,
    borderRadius: radius.round,
    backgroundColor: palette.accent,
    marginTop: 6,
  },
  taskCountPill: {
    minWidth: 38,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.round,
    backgroundColor: '#E9F7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCountText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: palette.textStrong,
    fontSize: typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  taskMeta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  addExistingButton: {
    borderRadius: radius.sm,
    backgroundColor: palette.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  addExistingButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  removeButton: {
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
});
