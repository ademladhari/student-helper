import React, { useState } from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import AppCard from '../src/components/AppCard';
import DocumentPicker from 'react-native-document-picker';
import type { FileLibraryApi, ManagedFile } from '../src/fileLibrary/useFileLibrary';
import { ROOT_FOLDER_ID, pickFilesFromDevice } from '../src/fileLibrary/useFileLibrary';
import { palette, radius, spacing, typography } from '../src/theme/tokens';

type Props = {
  onBack: () => void;
  fileLibrary: FileLibraryApi;
};

export default function FileManagerScreen({ onBack, fileLibrary }: Props) {
  const {
    hydrated,
    folders,
    managedFiles,
    filesByFolder,
    appendPickedFiles,
    addFolder,
    updateFile,
  } = fileLibrary;

  const [folderName, setFolderName] = useState('');
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFolderId, setEditFolderId] = useState(ROOT_FOLDER_ID);

  async function openFilePicker() {
    try {
      const files = await pickFilesFromDevice();
      appendPickedFiles(files);
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Could not open the file picker.';
      Alert.alert('File picker error', message);
    }
  }

  function onAddFolder() {
    const result = addFolder(folderName);

    if (!result.ok && result.reason === 'empty') {
      Alert.alert('Folder name required', 'Type a folder name before creating it.');
      return;
    }

    if (!result.ok && result.reason === 'duplicate') {
      Alert.alert('Folder exists', 'That folder name is already in use.');
      return;
    }

    setFolderName('');
  }

  function openFileModal(file: ManagedFile) {
    setActiveFileId(file.id);
    setEditName(file.displayName || file.name || '');
    setEditFolderId(file.folderId);
  }

  function closeFileModal() {
    setActiveFileId(null);
    setEditName('');
    setEditFolderId(ROOT_FOLDER_ID);
  }

  function saveFileModal() {
    if (!activeFileId) {
      return;
    }

    updateFile(activeFileId, {
      displayName: editName,
      folderId: editFolderId,
    });
    closeFileModal();
  }

  function openFile(file: ManagedFile) {
    if (!file.uri) {
      Alert.alert('Open failed', 'This file does not have a valid URI.');
      return;
    }

    Linking.openURL(file.uri).catch(() => {
      Alert.alert('Open failed', 'Unable to open this file on the device.');
    });
  }

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading library…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppCard>
        <View style={styles.rowSpace}>
          <Text style={styles.sectionTitle}>File Manager</Text>
          <Pressable style={styles.ghostButton} onPress={onBack}>
            <Text style={styles.ghostButtonText}>Back</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionBody}>
          Pick PDFs and documents from your device, create folders, and move files into the right place. Your library is
          saved on this device.
        </Text>
        <Pressable style={styles.primaryButton} onPress={openFilePicker}>
          <Text style={styles.primaryButtonText}>Add Files</Text>
        </Pressable>

        <View style={styles.folderCreator}>
          <TextInput
            value={folderName}
            onChangeText={setFolderName}
            placeholder="New folder name"
            placeholderTextColor={palette.textMuted}
            style={styles.folderInput}
          />
          <Pressable style={styles.secondaryButton} onPress={onAddFolder}>
            <Text style={styles.secondaryButtonText}>Create Folder</Text>
          </Pressable>
        </View>

        <View style={styles.folderStrip}>
          {folders.map(folder => (
            <View key={folder.id} style={styles.folderChip}>
              <Text style={styles.folderChipText}>{folder.name}</Text>
            </View>
          ))}
        </View>
      </AppCard>

      {filesByFolder.map(folder => (
        <AppCard key={folder.id}>
          <View style={styles.rowSpace}>
            <View>
              <Text style={styles.sectionTitle}>{folder.name}</Text>
              <Text style={styles.folderCount}>
                {folder.files.length} file{folder.files.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          {folder.files.length === 0 ? (
            <Text style={styles.emptyState}>No files in this folder.</Text>
          ) : null}

          <View style={styles.fileList}>
            {folder.files.map(file => (
              <View key={file.id} style={styles.fileRow}>
                <View style={styles.fileBadge}>
                  <Text style={styles.fileBadgeText}>FILE</Text>
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.displayName || file.name || 'Unnamed file'}
                  </Text>
                  <Text style={styles.fileMeta} numberOfLines={1}>
                    {file.type || 'Unknown type'} · {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                  </Text>
                  <View style={styles.fileActions}>
                    <Pressable style={styles.ghostButton} onPress={() => openFileModal(file)}>
                      <Text style={styles.ghostButtonText}>Manage</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </AppCard>
      ))}

      <Modal
        transparent
        visible={activeFileId !== null}
        animationType="fade"
        onRequestClose={closeFileModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Manage File</Text>
            {activeFileId ? (
              <>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="File name"
                  placeholderTextColor={palette.textMuted}
                  style={styles.modalInput}
                />
                <Text style={styles.modalLabel}>Move to folder</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalFolderRow}>
                  {folders.map(folder => (
                    <Pressable
                      key={folder.id}
                      style={[styles.modalChip, editFolderId === folder.id && styles.modalChipActive]}
                      onPress={() => setEditFolderId(folder.id)}>
                      <Text
                        style={[styles.modalChipText, editFolderId === folder.id && styles.modalChipTextActive]}>
                        {folder.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalActionSecondary}
                onPress={() => {
                  const file = managedFiles.find(item => item.id === activeFileId);
                  if (file) {
                    openFile(file);
                  }
                }}>
                <Text style={styles.modalActionSecondaryText}>Open File</Text>
              </Pressable>
              <View style={styles.modalActionsRight}>
                <Pressable style={styles.modalActionPrimary} onPress={saveFileModal}>
                  <Text style={styles.modalActionPrimaryText}>Save</Text>
                </Pressable>
                <Pressable style={styles.modalActionGhost} onPress={closeFileModal}>
                  <Text style={styles.modalActionGhostText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    color: palette.textMuted,
    fontSize: typography.body,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textStrong,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  folderCreator: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  folderInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: '#F9FBFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: palette.textStrong,
    fontSize: typography.body,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  secondaryButtonText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  folderStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  folderChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.round,
    backgroundColor: palette.primarySoft,
  },
  folderChipText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  rowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  folderCount: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  fileList: {
    gap: spacing.sm,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  fileBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileBadgeText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: palette.textStrong,
    fontWeight: '700',
    fontSize: typography.body,
  },
  fileMeta: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  fileActions: {
    marginTop: spacing.sm,
    alignItems: 'flex-start',
  },
  ghostButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FFFFFF',
  },
  ghostButtonText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 16, 32, 0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  modalTitle: {
    color: palette.textStrong,
    fontWeight: '700',
    fontSize: 18,
  },
  modalLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: '#F9FBFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: palette.textStrong,
    fontSize: typography.body,
  },
  modalFolderRow: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  modalChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.round,
    backgroundColor: '#EEF2F8',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  modalChipText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  modalChipTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  modalActionsRight: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  modalActionSecondary: {
    minWidth: 110,
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalActionSecondaryText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalActionPrimary: {
    minWidth: 90,
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: palette.primary,
  },
  modalActionPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalActionGhost: {
    minWidth: 90,
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FFFFFF',
  },
  modalActionGhostText: {
    color: palette.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    color: palette.textMuted,
    fontSize: typography.body,
    fontStyle: 'italic',
  },
});
