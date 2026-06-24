import ReactNativeBlobUtil from 'react-native-blob-util';
import type { DocumentPickerResponse } from 'react-native-document-picker';
import type { ManagedFile } from './useFileLibrary';

const LIBRARY_SUBDIR = 'file-library';

function getLibraryDir() {
  return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${LIBRARY_SUBDIR}`;
}

function sanitizeFileName(name: string) {
  const base = name.trim() || 'document';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function toFileUri(path: string) {
  return path.startsWith('file://') ? path : `file://${path}`;
}

function stripFileUri(uri: string) {
  return uri.startsWith('file://') ? uri.slice(7) : uri;
}

async function ensureLibraryDir() {
  const dir = getLibraryDir();
  const exists = await ReactNativeBlobUtil.fs.exists(dir);
  if (!exists) {
    await ReactNativeBlobUtil.fs.mkdir(dir);
  }
  return dir;
}

export async function persistPickedFileToLibrary(
  file: DocumentPickerResponse,
  id: string,
): Promise<string> {
  const dir = await ensureLibraryDir();
  const destPath = `${dir}/${id}-${sanitizeFileName(file.name || 'file')}`;
  const source = file.fileCopyUri || file.uri;

  if (!source) {
    throw new Error('Missing file URI');
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

export async function resolveManagedFileUri(file: ManagedFile): Promise<string | null> {
  if (file.localPath) {
    const path = stripFileUri(file.localPath);
    if (await ReactNativeBlobUtil.fs.exists(path)) {
      return toFileUri(path);
    }
  }

  const sources = [file.fileCopyUri, file.uri].filter((value): value is string => Boolean(value));

  for (const source of sources) {
    if (!source.startsWith('file://')) {
      continue;
    }

    const path = stripFileUri(source);
    if (!(await ReactNativeBlobUtil.fs.exists(path))) {
      continue;
    }

    try {
      return await persistPickedFileToLibrary({ ...file, uri: source, fileCopyUri: source }, file.id);
    } catch {
      return toFileUri(path);
    }
  }

  for (const source of sources) {
    try {
      return await persistPickedFileToLibrary({ ...file, uri: source, fileCopyUri: source }, file.id);
    } catch {
      // Try the next URI.
    }
  }

  return null;
}
