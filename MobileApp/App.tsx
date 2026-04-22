import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import HomeScreen from './screens/HomeScreen';
import AuthScreen from './screens/AuthScreen';
import FocusScreen from './screens/FocusScreen';
import ScanScreen from './screens/ScanScreen';
import StatsScreen from './screens/StatsScreen';
import TasksScreen from './screens/TasksScreen';
import { palette, radius, spacing } from './src/theme/tokens';
import { DeadlineCandidate, FocusSessionState, TaskDraftInput, TaskItem } from './src/types/study';
import {
  buildTodayPlan,
  convertCandidatesToDraftTasks,
  summarizeStats,
} from './src/utils/studyPlanner';

type TabKey = 'Home' | 'Scan' | 'Tasks' | 'Stats';
type ScreenRoute = TabKey | 'Focus';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

const tabs: TabKey[] = ['Home', 'Scan', 'Tasks', 'Stats'];
const tabIcons: Record<TabKey, string> = {
  Home: 'H',
  Scan: 'S',
  Tasks: 'T',
  Stats: 'ST',
};

function createInitialFocusSession(): FocusSessionState {
  return {
    sessionMinutes: 25,
    secondsLeft: 25 * 60,
    isPaused: false,
    phase: 'focus',
    showTaskPicker: false,
    showQuickAdd: false,
    blockTasks: [],
    quickTaskTitle: '',
    quickTaskPomodoros: '1',
  };
}

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenRoute>('Home');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [focusSession, setFocusSession] = useState<FocusSessionState>(() => createInitialFocusSession());

  const stats = useMemo(() => summarizeStats(tasks), [tasks]);
  const todayPlan = useMemo(() => buildTodayPlan(tasks), [tasks]);

  const isAuthenticated = authUser !== null;

  function addTask(input: TaskDraftInput) {
    const title = input.title.trim();

    if (!title) {
      return;
    }

    const task: TaskItem = {
      id: `task-${Date.now()}`,
      title,
      dueDate: input.dueDate,
      status: 'todo',
      source: 'manual',
      estimatedPomodoros: Math.max(1, Math.round(input.estimatedPomodoros)),
    };

    setTasks(current => [task, ...current]);
    return task;
  }

  function createDraftTasks(candidates: DeadlineCandidate[]) {
    if (candidates.length === 0) {
      return;
    }

    const drafts = convertCandidatesToDraftTasks(candidates);
    setTasks(current => [...drafts, ...current]);
    setActiveScreen('Tasks');
  }

  function confirmDraft(id: string) {
    setTasks(current =>
      current.map(task => (task.id === id ? { ...task, status: 'todo' } : task)),
    );
  }

  function toggleDone(id: string) {
    setTasks(current =>
      current.map(task => {
        if (task.id !== id) {
          return task;
        }

        return {
          ...task,
          status: task.status === 'done' ? 'todo' : 'done',
        };
      }),
    );
  }

  const pauseFocusSession = useCallback(() => {
    setFocusSession(current => ({
      ...current,
      isPaused: true,
    }));
  }, []);

  const goToScreen = useCallback((nextScreen: ScreenRoute) => {
    if (activeScreen === 'Focus' && nextScreen !== 'Focus') {
      pauseFocusSession();
    }

    setActiveScreen(nextScreen);
  }, [activeScreen, pauseFocusSession]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active' && activeScreen === 'Focus') {
        pauseFocusSession();
      }
    });

    return () => subscription.remove();
  }, [activeScreen, pauseFocusSession]);

  const ScreenComponent = useMemo(() => {
    if (!isAuthenticated) {
      return (
        <AuthScreen
          onAuthenticated={({ user }) => {
            setAuthUser(user);
            setActiveScreen('Home');
          }}
        />
      );
    }

    if (activeScreen === 'Scan') {
      return <ScanScreen onCreateDrafts={createDraftTasks} />;
    }

    if (activeScreen === 'Focus') {
      return (
        <FocusScreen
          tasks={tasks}
          focusSession={focusSession}
          setFocusSession={setFocusSession}
          onAddTask={addTask}
          onBack={() => goToScreen('Home')}
        />
      );
    }

    if (activeScreen === 'Tasks') {
      return (
        <TasksScreen
          tasks={tasks}
          onAddTask={addTask}
          onConfirmDraft={confirmDraft}
          onToggleDone={toggleDone}
        />
      );
    }

    if (activeScreen === 'Stats') {
      return <StatsScreen {...stats} />;
    }

    return (
      <HomeScreen
        tasks={tasks}
        todayPlan={todayPlan}
        onOpenScan={() => goToScreen('Scan')}
        onStartFocus={() => goToScreen('Focus')}
      />
    );
  }, [activeScreen, focusSession, goToScreen, isAuthenticated, stats, tasks, todayPlan]);

  function signOut() {
    setAuthUser(null);
    setActiveScreen('Home');
    setFocusSession(createInitialFocusSession());
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />

      {isAuthenticated ? (
        <View style={styles.header}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authUser ? authUser.name.slice(0, 2).toUpperCase() : 'AL'}</Text>
          </View>
          <View>
            <Text style={styles.brand}>SmartStudy</Text>
            <Text style={styles.userEmail}>{authUser?.email}</Text>
          </View>
        </View>
        <Pressable style={styles.settingsPill} onPress={signOut}>
          <Text style={styles.settingsText}>Out</Text>
        </Pressable>
      </View>
      ) : null}

      <View style={styles.content}>{ScreenComponent}</View>

      {isAuthenticated ? (
        <View style={styles.tabBar}>
        {tabs.map(tab => {
          const isActive = tab === activeScreen;
          return (
            <Pressable
              key={tab}
              onPress={() => goToScreen(tab)}
              style={[styles.tabButton, isActive && styles.activeTabButton]}>
              <View style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                <Text style={[styles.tabIconText, isActive && styles.activeTabIconText]}>
                  {tabIcons[tab]}
                </Text>
              </View>
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
            </Pressable>
          );
        })}
        </View>
      ) : null}

      {isAuthenticated && activeScreen === 'Home' ? (
        <Pressable style={styles.fab} onPress={() => goToScreen('Tasks')}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E3848',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: palette.primary,
  },
  settingsPill: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surfaceSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: palette.border,
  },
  settingsText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  userEmail: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    shadowColor: '#8FA2B8',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 3,
  },
  tabButton: {
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  activeTabButton: {
    backgroundColor: '#F3F7FF',
  },
  tabIcon: {
    width: 20,
    height: 20,
    borderRadius: radius.round,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
    backgroundColor: '#EAF0FA',
  },
  activeTabIcon: {
    backgroundColor: '#DDE6FF',
  },
  tabIconText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#62738D',
  },
  activeTabIconText: {
    color: palette.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5B6E89',
  },
  activeTabText: {
    color: palette.primary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 72,
    width: 50,
    height: 50,
    borderRadius: radius.round,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4D5FCC',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 24,
    marginTop: -2,
  },
});

export default App;
