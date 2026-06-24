import ReactNativeBlobUtil from 'react-native-blob-util';
import type { DocumentPickerResponse } from 'react-native-document-picker';

const MUSIC_SUBDIR = 'music-library';

function getMusicDir() {
  return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${MUSIC_SUBDIR}`;
}

function sanitizeFileName(name: string) {
  const base = name.trim() || 'track';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function toFileUri(path: string) {
  return path.startsWith('file://') ? path : `file://${path}`;
}

function stripFileUri(uri: string) {
  return uri.startsWith('file://') ? uri.slice(7) : uri;
}

async function ensureMusicDir() {
  const dir = getMusicDir();
  const exists = await ReactNativeBlobUtil.fs.exists(dir);
  if (!exists) {
    await ReactNativeBlobUtil.fs.mkdir(dir);
  }
  return dir;
}

export async function persistPickedAudioToLibrary(
  file: DocumentPickerResponse,
  id: string,
): Promise<string> {
  const dir = await ensureMusicDir();
  const destPath = `${dir}/${id}-${sanitizeFileName(file.name || 'track.mp3')}`;
  const source = file.fileCopyUri || file.uri;

  if (!source) {
    throw new Error('Missing audio file URI');
  }

  if (await ReactNativeBlobUtil.fs.exists(destPath)) {
    return toFileUri(destPath);
  }

  if (source.startsWith('file://')) {
    const srcPath = stripFileUri(source);
    if (await ReactNativeBlobUtil.fs.exists(srcPath)) {
      await ReactNativeBlobUtil.fs.cp(srcPath, destPath);
      return toFileUri(destPath);
    }
  }

  const base64 = await ReactNativeBlobUtil.fs.readFile(source, 'base64');
  await ReactNativeBlobUtil.fs.writeFile(destPath, base64, 'base64');
  return toFileUri(destPath);
}

export async function resolveStoredAudioUri(localPath: string): Promise<string | null> {
  const path = stripFileUri(localPath);
  if (await ReactNativeBlobUtil.fs.exists(path)) {
    return toFileUri(path);
  }
  return null;
}
