import React, { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../src/components/AppCard';
import { AmbientSound, builtInAmbientSounds } from '../src/music/ambientSounds';
import type { useAmbientLibrary } from '../src/music/useAmbientLibrary';
import { palette, radius, spacing, typography } from '../src/theme/tokens';
import { AmbientState } from '../src/types/ambient';

type AmbientLibraryApi = Pick<
  ReturnType<typeof useAmbientLibrary>,
  'userTracks' | 'addTracksFromDevice' | 'removeTrack'
>;

type Props = {
  onBack: () => void;
  ambientState: AmbientState;
  setAmbientState: React.Dispatch<React.SetStateAction<AmbientState>>;
  onAdjustVolume: (delta: number) => void;
  onSetVolume: (volume: number) => void;
  ambientLibrary: AmbientLibraryApi;
};

function SoundRow({
  sound,
  isActive,
  isPlaying,
  onPress,
  onRemove,
}: {
  sound: AmbientSound;
  isActive: boolean;
  isPlaying: boolean;
  onPress: () => void;
  onRemove?: () => void;
}) {
  const actionLabel = isPlaying ? 'Pause' : 'Play';

  return (
    <View style={styles.soundRow}>
      <View style={styles.soundInfo}>
        <Text style={styles.soundTitle}>{sound.title}</Text>
        <Text style={styles.soundMeta}>{sound.description}</Text>
      </View>
      <View style={styles.soundActions}>
        {onRemove ? (
          <Pressable style={styles.removeButton} onPress={onRemove}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.soundButton, isPlaying && styles.soundButtonActive]}
          onPress={onPress}>
          <Text style={styles.soundButtonText}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AmbientSoundScreen({
  onBack,
  ambientState,
  setAmbientState,
  onAdjustVolume,
  onSetVolume,
  ambientLibrary,
}: Props) {
  const { activeId, paused, volume, syncWithPomodoro } = ambientState;
  const [isAdding, setIsAdding] = useState(false);

  function handleSoundPress(sound: AmbientSound) {
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
    onAdjustVolume(delta);
  }

  const volumeTrackWidth = useRef(0);

  function setVolumeFromPosition(x: number) {
    if (volumeTrackWidth.current <= 0) {
      return;
    }

    const next = Math.min(1, Math.max(0, x / volumeTrackWidth.current));
    onSetVolume(next);
  }

  function stopPlayback() {
    setAmbientState(current => ({
      ...current,
      activeId: null,
      paused: false,
    }));
  }

  async function handleAddMusic() {
    setIsAdding(true);
    try {
      const addedCount = await ambientLibrary.addTracksFromDevice();
      if (addedCount === 0) {
        Alert.alert('No tracks added', 'Pick at least one audio file from your device.');
      }
    } catch (error) {
      if (DocumentPickerIsCancel(error)) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Could not import audio files.';
      Alert.alert('Import failed', message);
    } finally {
      setIsAdding(false);
    }
  }

  function handleRemoveTrack(sound: AmbientSound) {
    Alert.alert('Remove track', `Remove "${sound.title}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          if (activeId === sound.id) {
            stopPlayback();
          }
          ambientLibrary.removeTrack(sound.id);
        },
      },
    ]);
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
        <Text style={styles.subtitle}>Pick a soundscape, import your own music, and set volume.</Text>
      </AppCard>

      <AppCard>
        <View style={styles.volumeRow}>
          <Text style={styles.volumeLabel}>Volume</Text>
          <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
        </View>
        <View style={styles.volumeControls}>
          <Pressable style={styles.volumeButton} onPress={() => adjustVolume(-0.15)}>
            <Text style={styles.volumeButtonText}>-</Text>
          </Pressable>
          <View
            style={styles.volumeSliderTrack}
            onLayout={event => {
              volumeTrackWidth.current = event.nativeEvent.layout.width;
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={event => setVolumeFromPosition(event.nativeEvent.locationX)}
            onResponderMove={event => setVolumeFromPosition(event.nativeEvent.locationX)}>
            <View style={[styles.volumeSliderFill, { width: `${Math.round(volume * 100)}%` }]} />
            <View style={[styles.volumeSliderThumb, { left: `${Math.round(volume * 100)}%` }]} />
          </View>
          <Pressable style={styles.volumeButton} onPress={() => adjustVolume(0.15)}>
            <Text style={styles.volumeButtonText}>+</Text>
          </Pressable>
        </View>
        {syncWithPomodoro ? (
          <Text style={styles.syncHint}>Synced with Pomodoro sessions.</Text>
        ) : (
          <Text style={styles.syncHintMuted}>Not synced with Pomodoro yet.</Text>
        )}

        <Text style={styles.groupLabel}>Built-in tracks</Text>
        {builtInAmbientSounds.map(sound => {
          const isActive = activeId === sound.id;
          const isPlaying = isActive && !paused;
          return (
            <SoundRow
              key={sound.id}
              sound={sound}
              isActive={isActive}
              isPlaying={isPlaying}
              onPress={() => handleSoundPress(sound)}
            />
          );
        })}

        <View style={styles.groupHeader}>
          <Text style={styles.groupLabel}>Your music</Text>
          <Pressable style={styles.addButton} onPress={handleAddMusic} disabled={isAdding}>
            <Text style={styles.addButtonText}>{isAdding ? 'Adding…' : 'Add from device'}</Text>
          </Pressable>
        </View>
        {ambientLibrary.userTracks.length === 0 ? (
          <Text style={styles.emptyHint}>Import MP3 or other audio files from your phone storage.</Text>
        ) : null}
        {ambientLibrary.userTracks.map(sound => {
          const isActive = activeId === sound.id;
          const isPlaying = isActive && !paused;
          return (
            <SoundRow
              key={sound.id}
              sound={sound}
              isActive={isActive}
              isPlaying={isPlaying}
              onPress={() => handleSoundPress(sound)}
              onRemove={() => handleRemoveTrack(sound)}
            />
          );
        })}

        {activeId ? (
          <Pressable style={styles.stopButton} onPress={stopPlayback}>
            <Text style={styles.stopButtonText}>Stop playback</Text>
          </Pressable>
        ) : null}
        <Text style={styles.footnote}>
          Built-in lofi samples plus tracks copied into app storage from your device.
        </Text>
      </AppCard>
    </ScrollView>
  );
}

function DocumentPickerIsCancel(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'DOCUMENT_PICKER_CANCELED'
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
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  volumeSliderTrack: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    borderRadius: radius.round,
    backgroundColor: '#D4DEED',
    overflow: 'visible',
  },
  volumeSliderFill: {
    position: 'absolute',
    left: 0,
    top: 14,
    height: 8,
    borderRadius: radius.round,
    backgroundColor: palette.primary,
  },
  volumeSliderThumb: {
    position: 'absolute',
    top: 8,
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: palette.primary,
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
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  groupLabel: {
    color: palette.textStrong,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  addButtonText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyHint: {
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
  soundActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceSoft,
  },
  removeButtonText: {
    color: '#B54747',
    fontWeight: '700',
    fontSize: 11,
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
