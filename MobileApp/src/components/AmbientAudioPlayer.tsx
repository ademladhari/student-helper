import React, { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Video, { type VideoRef } from 'react-native-video';
import { AmbientSound, resolveAmbientVideoSource } from '../music/ambientSounds';

export type AmbientAudioPlayerHandle = {
  setVolume: (volume: number) => void;
};

type Props = {
  sound: AmbientSound;
  paused: boolean;
  volume: number;
};

function AmbientAudioPlayer(
  { sound, paused, volume }: Props,
  ref: React.ForwardedRef<AmbientAudioPlayerHandle>,
) {
  const playerRef = useRef<VideoRef>(null);

  const applyVolume = useCallback((nextVolume: number) => {
    const clamped = Math.min(1, Math.max(0, nextVolume));
    playerRef.current?.setVolume(clamped);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setVolume: applyVolume,
    }),
    [applyVolume],
  );

  useLayoutEffect(() => {
    applyVolume(volume);
  }, [applyVolume, volume, sound.id]);

  return (
    <View style={styles.host} pointerEvents="none">
      <Video
        ref={playerRef}
        source={resolveAmbientVideoSource(sound)}
        paused={paused}
        volume={volume}
        muted={volume <= 0}
        repeat
        audioOnly
        playInBackground
        playWhenInactive
        ignoreSilentSwitch="ignore"
        onLoad={() => {
          applyVolume(volume);
        }}
        onPlaybackStateChanged={event => {
          if (event.isPlaying) {
            applyVolume(volume);
          }
        }}
        style={styles.player}
      />
    </View>
  );
}

export default forwardRef(AmbientAudioPlayer);

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    width: 2,
    height: 2,
    opacity: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  player: {
    width: 2,
    height: 2,
  },
});
