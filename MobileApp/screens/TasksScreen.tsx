import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppCard from '../src/components/AppCard';
import { palette, radius, spacing, typography } from '../src/theme/tokens';
import { TaskDraftInput, TaskItem } from '../src/types/study';

type Props = {
  tasks: TaskItem[];
  onAddTask: (task: TaskDraftInput) => void;
  onConfirmDraft: (id: string) => void;
  onToggleDone: (id: string) => void;
};

type FilterKey = 'all' | 'draft' | 'todo' | 'done';

const filters: FilterKey[] = ['all', 'draft', 'todo', 'done'];

export default function TasksScreen({ tasks, onAddTask, onConfirmDraft, onToggleDone }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [pomodoros, setPomodoros] = useState('1');

  const filtered = useMemo(() => {
    if (activeFilter === 'all') {
      return tasks;
    }

    return tasks.filter(task => task.status === activeFilter);
  }, [activeFilter, tasks]);

  function handleAddTask() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      Alert.alert('Missing title', 'Add a task title first.');
      return;
    }

    const parsedPomodoros = Number.parseInt(pomodoros, 10);
    const safePomodoros = Number.isNaN(parsedPomodoros) ? 1 : Math.max(1, parsedPomodoros);
    const parsedDate = new Date(dueDate);
    const safeDueDate = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();

    onAddTask({
      title: trimmedTitle,
      dueDate: safeDueDate,
      estimatedPomodoros: safePomodoros,
    });

    setTitle('');
    setDueDate('');
    setPomodoros('1');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppCard soft>
        <Text style={styles.heading}>Tasks and Deadlines</Text>
        <Text style={styles.subtitle}>Create real tasks, estimate pomodoros, and mark progress as you go.</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Add Task</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
        />
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="Due date (YYYY-MM-DD)"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
        />
        <TextInput
          value={pomodoros}
          onChangeText={setPomodoros}
          placeholder="Pomodoros"
          placeholderTextColor={palette.textMuted}
          keyboardType="number-pad"
          style={styles.input}
        />
        <Pressable onPress={handleAddTask} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add Task</Text>
        </Pressable>
      </AppCard>

      <View style={styles.filterRow}>
        {filters.map(filter => {
          const active = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterPill, active && styles.activeFilterPill]}>
              <Text style={[styles.filterText, active && styles.activeFilterText]}>{filter.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>

      <AppCard>
        {filtered.length === 0 ? <Text style={styles.empty}>No tasks in this filter yet.</Text> : null}
        {filtered.map(task => (
          <View key={task.id} style={styles.taskRow}>
            <View style={styles.taskMain}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskMeta}>
                Due {new Date(task.dueDate).toLocaleDateString()} • {task.estimatedPomodoros}x Pomodoro
              </Text>
            </View>

            <View style={styles.actions}>
              {task.status === 'draft' ? (
                <Pressable onPress={() => onConfirmDraft(task.id)} style={styles.confirmBtn}>
                  <Text style={styles.confirmText}>Confirm</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => onToggleDone(task.id)} style={styles.stateBtn}>
                  <Text style={styles.stateText}>{task.status === 'done' ? 'Reopen' : 'Done'}</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textStrong,
    marginBottom: spacing.sm,
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
  addButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterPill: {
    backgroundColor: '#F5F8FF',
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeFilterPill: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  filterText: {
    color: palette.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  taskRow: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  taskMain: {
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
  actions: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  confirmBtn: {
    backgroundColor: palette.accent,
    borderRadius: radius.sm,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  stateBtn: {
    backgroundColor: palette.primarySoft,
    borderRadius: radius.sm,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  stateText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  empty: {
    color: palette.textMuted,
  },
});
