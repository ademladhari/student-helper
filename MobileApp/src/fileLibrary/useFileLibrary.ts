import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ROOT_FOLDER_ID = 'ungrouped';
const STORAGE_KEY = 'utility.fileManager.v1';

export type ManagedFolder = {
  id: string;
  name: string;
};

export type ManagedFile = DocumentPickerResponse & {
  id: string;
  folderId: string;
  displayName?: string;
};

type StoredState = {
  folders: ManagedFolder[];
  managedFiles: ManagedFile[];
};

function ensureRootFolder(nextFolders: ManagedFolder[]) {
  if (nextFolders.some(folder => folder.id === ROOT_FOLDER_ID)) {
    return nextFolders;
  }
  return [{ id: ROOT_FOLDER_ID, name: 'Ungrouped' }, ...nextFolders];
}

function normalizeStoredFiles(raw: unknown[]): ManagedFile[] {
  return raw.map((item, index) => {
    const f = item as ManagedFile & { id?: string };
    return {
      ...f,
      id: f.id || `legacy-${String(f.uri || index)}-${index}`,
      folderId: f.folderId || ROOT_FOLDER_ID,
    };
  });
}

export function isDocumentFile(file: ManagedFile) {
  const name = (file.displayName || file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();

  if (type.includes('pdf') || type.includes('msword') || type.includes('officedocument')) {
    return true;
  }

  return (
    name.endsWith('.pdf') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.txt')
  );
}

export type FileLibraryApi = {
  hydrated: boolean;
  folders: ManagedFolder[];
  managedFiles: ManagedFile[];
  filesByFolder: Array<ManagedFolder & { files: ManagedFile[] }>;
  appendPickedFiles: (files: DocumentPickerResponse[]) => void;
  addFolder: (name: string) => { ok: true } | { ok: false; reason: 'empty' | 'duplicate' };
  updateFile: (id: string, patch: { displayName?: string; folderId?: string }) => void;
};

export function useFileLibrary(): FileLibraryApi {
  const [folders, setFolders] = useState<ManagedFolder[]>([
    { id: ROOT_FOLDER_ID, name: 'Ungrouped' },
  ]);
  const [managedFiles, setManagedFiles] = useState<ManagedFile[]>([]);
  const [hydrated, setHydrated] = useState(false);
  /** Avoid writing empty/default state over storage before load finishes or after corrupt JSON. */
  const allowPersistRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!isMounted) {
          return;
        }

        try {
          if (raw == null || String(raw).trim() === '') {
            allowPersistRef.current = true;
            return;
          }

          const parsed = JSON.parse(raw) as StoredState;
          const ensuredFolders = ensureRootFolder(parsed.folders || []);
          setFolders(ensuredFolders);
          setManagedFiles(normalizeStoredFiles(parsed.managedFiles || []));
          allowPersistRef.current = true;
        } catch {
          allowPersistRef.current = false;
          setFolders(ensureRootFolder([]));
        }
      })
      .catch(() => {
        if (isMounted) {
          allowPersistRef.current = false;
          setFolders(ensureRootFolder([]));
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
    const payload: StoredState = { folders, managedFiles };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [folders, managedFiles, hydrated]);

  const filesByFolder = useMemo(() => {
    return folders.map(folder => ({
      ...folder,
      files: managedFiles.filter(file => file.folderId === folder.id),
    }));
  }, [folders, managedFiles]);

  const appendPickedFiles = useCallback((files: DocumentPickerResponse[]) => {
    const baseTime = Date.now();
    setManagedFiles(currentFiles => [
      ...currentFiles,
      ...files.map((file, index) => ({
        ...file,
        id: `file-${baseTime}-${index}`,
        folderId: ROOT_FOLDER_ID,
        displayName: file.name || 'Unnamed file',
      })),
    ]);
  }, []);

  const addFolder = useCallback(
    (name: string) => {
      const normalizedName = name.trim();
      if (!normalizedName) {
        return { ok: false as const, reason: 'empty' as const };
      }

      const duplicateFolder = folders.some(
        folder => folder.name.toLowerCase() === normalizedName.toLowerCase(),
      );

      if (duplicateFolder) {
        return { ok: false as const, reason: 'duplicate' as const };
      }

      setFolders(currentFolders => [
        ...currentFolders,
        {
          id: `folder-${Date.now()}`,
          name: normalizedName,
        },
      ]);

      return { ok: true as const };
    },
    [folders],
  );

  const updateFile = useCallback((id: string, patch: { displayName?: string; folderId?: string }) => {
    setManagedFiles(currentFiles =>
      currentFiles.map(file => {
        if (file.id !== id) {
          return file;
        }
        const next: ManagedFile = { ...file };
        if (patch.folderId !== undefined) {
          next.folderId = patch.folderId;
        }
        if (patch.displayName !== undefined) {
          const trimmed = patch.displayName.trim();
          next.displayName = trimmed || file.displayName || file.name || 'Unnamed file';
        }
        return next;
      }),
    );
  }, []);

  return {
    hydrated,
    folders,
    managedFiles,
    filesByFolder,
    appendPickedFiles,
    addFolder,
    updateFile,
  };
}

export async function pickFilesFromDevice() {
  return DocumentPicker.pick({
    type: [DocumentPicker.types.allFiles],
    allowMultiSelection: true,
  });
}
