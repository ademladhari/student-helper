import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../src/components/AppCard';
import { ambientSounds } from '../src/music/ambientSounds';
import { palette, radius, spacing, typography } from '../src/theme/tokens';
import { AmbientState } from '../src/types/ambient';

type Props = {
  onBack: () => void;
  ambientState: AmbientState;
  setAmbientState: React.Dispatch<React.SetStateAction<AmbientState>>;
};

export default function AmbientSoundScreen({ onBack, ambientState, setAmbientState }: Props) {
  const { activeId, paused, volume, syncWithPomodoro } = ambientState;

  function handleSoundPress(sound: typeof ambientSounds[number]) {
    const isActive = sound.id === activeId;
    if (isActive) {
      setAmbientState(current => ({ ...current, paused: !current.paused }));
      return;
    }

    setAmbientState(current => ({
      ...current,
      activeId: sound.id,
      paused: false,
    }));
  }

  function adjustVolume(delta: number) {
    setAmbientState(current => {
      const next = Math.min(1, Math.max(0, current.volume + delta));
      return {
        ...current,
        volume: Math.round(next * 100) / 100,
      };
    });
  }

  function stopPlayback() {
    setAmbientState(current => ({
      ...current,
      activeId: null,
      paused: false,
    }));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppCard soft>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Ambient soundscapes</Text>
        </View>
        <Text style={styles.subtitle}>Pick a soundscape and set its own volume.</Text>
      </AppCard>

      <AppCard>
        <View style={styles.volumeRow}>
          <Text style={styles.volumeLabel}>Volume</Text>
          <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
        </View>
        <View style={styles.volumeControls}>
          <Pressable style={styles.volumeButton} onPress={() => adjustVolume(-0.1)}>
            <Text style={styles.volumeButtonText}>-</Text>
          </Pressable>
          <Pressable style={styles.volumeButton} onPress={() => adjustVolume(0.1)}>
            <Text style={styles.volumeButtonText}>+</Text>
          </Pressable>
        </View>
        {syncWithPomodoro ? (
          <Text style={styles.syncHint}>Synced with Pomodoro sessions.</Text>
        ) : (
          <Text style={styles.syncHintMuted}>Not synced with Pomodoro yet.</Text>
        )}
        {ambientSounds.map(sound => {
          const isActive = activeId === sound.id;
          const isPlaying = isActive && !paused;
          const actionLabel = isPlaying ? 'Pause' : 'Play';
          return (
            <View key={sound.id} style={styles.soundRow}>
              <View style={styles.soundInfo}>
                <Text style={styles.soundTitle}>{sound.title}</Text>
                <Text style={styles.soundMeta}>{sound.description}</Text>
              </View>
              <Pressable
                style={[styles.soundButton, isPlaying && styles.soundButtonActive]}
                onPress={() => handleSoundPress(sound)}>
                <Text style={styles.soundButtonText}>{actionLabel}</Text>
              </Pressable>
            </View>
          );
        })}
        {activeId ? (
          <Pressable style={styles.stopButton} onPress={stopPlayback}>
            <Text style={styles.stopButtonText}>Stop playback</Text>
          </Pressable>
        ) : null}
        <Text style={styles.footnote}>Local ambient files from the music folder.</Text>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceSoft,
  },
  backText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: typography.section,
    fontWeight: '700',
    color: palette.textStrong,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 23,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  volumeLabel: {
    color: palette.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  volumeValue: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  volumeControls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  volumeButton: {
    width: 44,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.primary,
  },
  syncHint: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  syncHintMuted: {
    color: palette.textMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  soundInfo: {
    flex: 1,
    minWidth: 0,
  },
  soundTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textStrong,
  },
  soundMeta: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 4,
  },
  soundButton: {
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
  },
  soundButtonActive: {
    backgroundColor: '#263D6A',
  },
  soundButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  stopButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceSoft,
  },
  stopButtonText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  footnote: {
    marginTop: spacing.sm,
    color: palette.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
