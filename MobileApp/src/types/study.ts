export type TaskStatus = 'draft' | 'todo' | 'in-progress' | 'done';

export type TaskItem = {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  source: 'manual' | 'scan';
  estimatedPomodoros: number;
};

export type TaskDraftInput = {
  title: string;
  dueDate: string;
  estimatedPomodoros: number;
};

export type DeadlineCandidate = {
  title: string;
  dueDate: string;
  confidence: number;
  sourceSnippet: string;
};

export type StudyBlock = {
  title: string;
  minutes: number;
  pomodoros: number;
};

export type FocusPhase = 'focus' | 'break';

export type FocusBlockTask = {
  id: string;
  title: string;
  remainingPomodoros: number;
};

export type FocusSessionState = {
  sessionMinutes: 25 | 90;
  secondsLeft: number;
  isPaused: boolean;
  phase: FocusPhase;
  showTaskPicker: boolean;
  showQuickAdd: boolean;
  blockTasks: FocusBlockTask[];
  quickTaskTitle: string;
  quickTaskPomodoros: string;
};
