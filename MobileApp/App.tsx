import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import HomeScreen from './screens/HomeScreen';
import FocusScreen from './screens/FocusScreen';
import AuthScreen from './screens/AuthScreen';
import ScanScreen from './screens/ScanScreen';
import UtilityScreen from './screens/UtilityScreen';
import AmbientSoundScreen from './screens/AmbientSoundScreen';
import FileManagerScreen from './screens/FileManagerScreen';
import ProfileScreen from './screens/ProfileScreen';
import StatsScreen from './screens/StatsScreen';
import TasksScreen from './screens/TasksScreen';
import { palette, radius, spacing } from './src/theme/tokens';
import { builtInAmbientSounds } from './src/music/ambientSounds';
import { useAmbientLibrary } from './src/music/useAmbientLibrary';
import AmbientAudioPlayer, { type AmbientAudioPlayerHandle } from './src/components/AmbientAudioPlayer';
import { AmbientState } from './src/types/ambient';
import { DeadlineCandidate, FocusSessionState, LearningGoal, TaskDraftInput, TaskItem } from './src/types/study';
import {
  buildTodayPlan,
  convertCandidatesToDraftTasks,
  summarizeStats,
} from './src/utils/studyPlanner';
import { useFileLibrary } from './src/fileLibrary/useFileLibrary';
import { applyFocusBlocking, useFocusBlockedApps } from './src/hooks/useFocusAppBlocking';
import { startTimer, pauseTimer } from './src/utils/focusTimer';

type TabKey = 'Home' | 'Utility' | 'Tasks' | 'Stats' | 'Profile';
type ScreenRoute = TabKey | 'Focus' | 'FileManager' | 'Ambient';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

const tabs: TabKey[] = ['Home', 'Utility', 'Tasks', 'Stats', 'Profile'];
const tabIcons: Record<TabKey, string> = {
  Home: 'H',
  Utility: 'U',
  Tasks: 'T',
  Stats: 'ST',
  Profile: 'PR',
};

function createInitialFocusSession(): FocusSessionState {
  const secondsLeft = 25 * 60;
  return {
    sessionMinutes: 25,
    ...startTimer(secondsLeft),
    phase: 'focus',
    showTaskPicker: false,
    showQuickAdd: false,
    blockTasks: [],
    quickTaskTitle: '',
    quickTaskPomodoros: '1',
    appBlockingEnabled: false,
    showAppBlockerPicker: false,
  };
}

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenRoute>('Home');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser>({ id: 'guest', name: 'Guest', email: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [focusSession, setFocusSession] = useState<FocusSessionState>(() => createInitialFocusSession());
  const [learningGoal, setLearningGoal] = useState<LearningGoal>({
    title: '',
    targetTaskCount: 0,
    targetDate: '',
  });
  const [ambientState, setAmbientState] = useState<AmbientState>({
    activeId: null,
    paused: false,
    volume: 0.6,
    syncWithPomodoro: false,
  });

  const stats = useMemo(() => summarizeStats(tasks), [tasks]);
  const todayPlan = useMemo(() => buildTodayPlan(tasks), [tasks]);
  const fileLibrary = useFileLibrary();
  const ambientLibrary = useAmbientLibrary();
  const { hydrated: blockedAppsHydrated, blockedPackages, saveBlockedPackages } = useFocusBlockedApps();
  const allAmbientSounds = useMemo(
    () => [...builtInAmbientSounds, ...ambientLibrary.userTracks],
    [ambientLibrary.userTracks],
  );
  const activeAmbientSound = useMemo(
    () => allAmbientSounds.find(sound => sound.id === ambientState.activeId) || null,
    [allAmbientSounds, ambientState.activeId],
  );
  const ambientPomodoroPause =
    ambientState.syncWithPomodoro && (focusSession.phase !== 'focus' || focusSession.isPaused);
  const ambientPlayerRef = useRef<AmbientAudioPlayerHandle>(null);

  const applyAmbientVolume = useCallback((nextVolume: number) => {
    const clamped = Math.round(Math.min(1, Math.max(0, nextVolume)) * 100) / 100;
    setAmbientState(current => ({ ...current, volume: clamped }));
    ambientPlayerRef.current?.setVolume(clamped);
  }, []);

  const adjustAmbientVolume = useCallback(
    (delta: number) => {
      setAmbientState(current => {
        const clamped = Math.round(Math.min(1, Math.max(0, current.volume + delta)) * 100) / 100;
        ambientPlayerRef.current?.setVolume(clamped);
        return { ...current, volume: clamped };
      });
    },
    [],
  );
  const ambientPlayerPaused = ambientState.paused || ambientPomodoroPause;

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
      priority: input.priority,
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

  function createAiDraftTasks(drafts: TaskDraftInput[]) {
    if (drafts.length === 0) {
      return;
    }

    const taskDrafts: TaskItem[] = drafts.map((draft, index) => ({
      id: `draft-ai-${Date.now()}-${index}`,
      title: draft.title.trim() || 'Untitled task',
      dueDate: draft.dueDate,
      status: 'draft',
      source: 'scan',
      estimatedPomodoros: Math.max(1, Math.round(draft.estimatedPomodoros)),
      priority: draft.priority,
    }));

    setTasks(current => [...taskDrafts, ...current]);
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

        const isCompleting = task.status !== 'done';
        return {
          ...task,
          status: isCompleting ? 'done' : 'todo',
          completedAt: isCompleting ? new Date().toISOString() : undefined,
        };
      }),
    );
  }

  const pauseFocusSession = useCallback(() => {
    setFocusSession(current => ({
      ...current,
      ...pauseTimer(current),
    }));
  }, []);

  const goToScreen = useCallback((nextScreen: ScreenRoute) => {
    if (activeScreen === 'Focus' && nextScreen !== 'Focus') {
      pauseFocusSession();
    }

    setActiveScreen(nextScreen);
  }, [activeScreen, pauseFocusSession]);

  const syncAppBlocking = useCallback(
    (active: boolean) => {
      if (!blockedAppsHydrated) {
        return;
      }
      applyFocusBlocking(active, blockedPackages).catch(() => undefined);
    },
    [blockedAppsHydrated, blockedPackages],
  );

  const shouldEnforceAppBlocking =
    activeScreen === 'Focus' &&
    focusSession.appBlockingEnabled &&
    focusSession.phase === 'focus' &&
    !focusSession.isPaused &&
    blockedPackages.length > 0;

  useEffect(() => {
    if (!blockedAppsHydrated) {
      return;
    }

    applyFocusBlocking(shouldEnforceAppBlocking, blockedPackages).catch(() => undefined);
  }, [blockedAppsHydrated, shouldEnforceAppBlocking, blockedPackages, syncAppBlocking]);

  useEffect(() => {
    return () => {
      applyFocusBlocking(false, []).catch(() => undefined);
    };
  }, []);

  const ScreenComponent = useMemo(() => {
    if (activeScreen === 'Scan') {
      return <ScanScreen onCreateDrafts={createDraftTasks} onCreateAiDrafts={createAiDraftTasks} />;
    }
    if (activeScreen === 'FileManager') {
      return <FileManagerScreen onBack={() => goToScreen('Utility')} fileLibrary={fileLibrary} />;
    }
    if (activeScreen === 'Ambient') {
      return (
        <AmbientSoundScreen
          onBack={() => goToScreen('Utility')}
          ambientState={ambientState}
          setAmbientState={setAmbientState}
          onAdjustVolume={adjustAmbientVolume}
          onSetVolume={applyAmbientVolume}
          ambientLibrary={ambientLibrary}
        />
      );
    }
    if (activeScreen === 'Utility') {
      return (
        <UtilityScreen
          onOpenFileManager={() => goToScreen('FileManager')}
          onOpenAmbient={() => goToScreen('Ambient')}
          fileLibrary={fileLibrary}
        />
      );
    }
    if (activeScreen === 'Focus') {
      return (
        <FocusScreen
          tasks={tasks}
          focusSession={focusSession}
          setFocusSession={setFocusSession}
          onAddTask={addTask}
          onBack={() => goToScreen('Home')}
          onOpenAmbient={() => goToScreen('Ambient')}
          onToggleAmbientSync={() =>
            setAmbientState(current => ({
              ...current,
              syncWithPomodoro: !current.syncWithPomodoro,
            }))
          }
          ambientSyncEnabled={ambientState.syncWithPomodoro}
          ambientHasSelection={Boolean(ambientState.activeId)}
          blockedPackages={blockedPackages}
          onSaveBlockedPackages={saveBlockedPackages}
          onSyncAppBlocking={syncAppBlocking}
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
      return <StatsScreen {...stats} goal={learningGoal} tasks={tasks} />;
    }
    if (activeScreen === 'Profile') {
      return (
        <ProfileScreen
          user={authUser}
          onOpenTasks={() => goToScreen('Tasks')}
          onOpenStats={() => goToScreen('Stats')}
          onSignOut={signOut}
        />
      );
    }
    return (
      <HomeScreen
        tasks={tasks}
        todayPlan={todayPlan}
        goal={learningGoal}
        userName={authUser.name}
        onUpdateGoal={setLearningGoal}
        onOpenScan={() => goToScreen('Scan')}
        onStartFocus={() => goToScreen('Focus')}
      />
    );
  }, [
    activeScreen,
    fileLibrary.addFolder,
    fileLibrary.appendPickedFiles,
    fileLibrary.hydrated,
    fileLibrary.managedFiles,
    fileLibrary.updateFile,
    focusSession,
    goToScreen,
    learningGoal,
    authUser.name,
    tasks,
    stats,
    todayPlan,
    ambientState,
    adjustAmbientVolume,
    applyAmbientVolume,
    ambientLibrary.userTracks,
    ambientLibrary.addTracksFromDevice,
    ambientLibrary.removeTrack,
    blockedPackages,
    saveBlockedPackages,
    syncAppBlocking,
  ]);

  function signOut() {
    setAuthUser({ id: 'guest', name: 'Guest', email: '' });
    setIsAuthenticated(false);
    setActiveScreen('Home');
    setFocusSession(createInitialFocusSession());
  }

  function handleAuthenticated(result: { user: AuthUser; token: string }) {
    setAuthUser(result.user);
    setIsAuthenticated(true);
    setActiveScreen('Home');
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />

      <View style={styles.header}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authUser.name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.brand}>SmartStudy</Text>
            <Text style={styles.userEmail}>{authUser.email}</Text>
          </View>
        </View>
        <Pressable style={styles.settingsPill} onPress={() => goToScreen('Profile')}>
          <Text style={styles.settingsText}>Me</Text>
        </Pressable>
      </View>

      <View style={styles.content}>{ScreenComponent}</View>

      <View style={styles.tabBar}>
        {tabs.map(tab => {
          const isActive =
            tab === activeScreen ||
            (tab === 'Utility' && (activeScreen === 'FileManager' || activeScreen === 'Ambient'));
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

      {activeScreen === 'Home' ? (
        <Pressable style={styles.fab} onPress={() => goToScreen('Tasks')}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      ) : null}

      {activeAmbientSound ? (
        <AmbientAudioPlayer
          ref={ambientPlayerRef}
          sound={activeAmbientSound}
          paused={ambientPlayerPaused}
          volume={ambientState.volume}
        />
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
