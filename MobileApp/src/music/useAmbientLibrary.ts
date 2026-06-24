import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';
import type { AmbientSound } from './ambientSounds';
import { persistPickedAudioToLibrary, resolveStoredAudioUri } from './ambientStorage';

const STORAGE_KEY = 'utility.ambientLibrary.v1';

export type StoredUserTrack = {
  id: string;
  title: string;
  localPath: string;
};

function toAmbientSound(track: StoredUserTrack): AmbientSound {
  return {
    id: track.id,
    title: track.title,
    description: 'From your device',
    source: { uri: track.localPath },
    isUserTrack: true,
  };
}

export function useAmbientLibrary() {
  const [userTracks, setUserTracks] = useState<AmbientSound[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const allowPersistRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then(async raw => {
        if (!isMounted) {
          return;
        }

        try {
          if (raw == null || String(raw).trim() === '') {
            allowPersistRef.current = true;
            return;
          }

          const parsed = JSON.parse(raw) as StoredUserTrack[];
          const resolved: AmbientSound[] = [];

          for (const track of parsed) {
            const uri = await resolveStoredAudioUri(track.localPath);
            if (uri) {
              resolved.push(toAmbientSound({ ...track, localPath: uri }));
            }
          }

          setUserTracks(resolved);
          allowPersistRef.current = true;
        } catch {
          allowPersistRef.current = false;
        }
      })
      .catch(() => {
        if (isMounted) {
          allowPersistRef.current = false;
        }
      })
      .finally(() => {
        if (isMounted) {
          setHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !allowPersistRef.current) {
      return;
    }

    const payload: StoredUserTrack[] = userTracks.map(track => ({
      id: track.id,
      title: track.title,
      localPath: typeof track.source === 'object' && 'uri' in track.source ? track.source.uri : '',
    }));

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [userTracks, hydrated]);

  const addTracksFromDevice = useCallback(async () => {
    const picked = await DocumentPicker.pick({
      type: [DocumentPicker.types.audio],
      allowMultiSelection: true,
      copyTo: 'cachesDirectory',
    });

    const baseTime = Date.now();
    const added: AmbientSound[] = [];

    for (let index = 0; index < picked.length; index += 1) {
      const file = picked[index];
      const id = `user-audio-${baseTime}-${index}`;
      const localPath = await persistPickedAudioToLibrary(file, id);
      const title = (file.name || 'Untitled track').replace(/\.[^.]+$/, '');

      added.push({
        id,
        title,
        description: 'From your device',
        source: { uri: localPath },
        isUserTrack: true,
      });
    }

    if (added.length > 0) {
      setUserTracks(current => [...current, ...added]);
    }

    return added.length;
  }, []);

  const removeTrack = useCallback((id: string) => {
    setUserTracks(current => current.filter(track => track.id !== id));
  }, []);

  return {
    hydrated,
    userTracks,
    addTracksFromDevice,
    removeTrack,
  };
}
