import type { FocusSessionState } from '../types/study';

export function getRemainingSeconds(session: Pick<FocusSessionState, 'timerEndsAt' | 'secondsLeft' | 'isPaused'>) {
  if (session.isPaused || session.timerEndsAt == null) {
    return session.secondsLeft;
  }

  return Math.max(0, Math.ceil((session.timerEndsAt - Date.now()) / 1000));
}

export function startTimer(secondsLeft: number) {
  return {
    secondsLeft,
    isPaused: false,
    timerEndsAt: Date.now() + secondsLeft * 1000,
  };
}

export function pauseTimer(session: Pick<FocusSessionState, 'timerEndsAt' | 'secondsLeft' | 'isPaused'>) {
  return {
    secondsLeft: getRemainingSeconds(session),
    isPaused: true,
    timerEndsAt: null,
  };
}

export function resumeTimer(secondsLeft: number) {
  return startTimer(secondsLeft);
}
