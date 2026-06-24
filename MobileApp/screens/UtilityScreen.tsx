import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../src/components/AppCard';
import { isDocumentFile, type FileLibraryApi } from '../src/fileLibrary/useFileLibrary';
import { palette, radius, spacing, typography } from '../src/theme/tokens';

type Props = {
  onOpenFileManager: () => void;
  onOpenAmbient: () => void;
  fileLibrary: Pick<FileLibraryApi, 'hydrated' | 'filesByFolder'>;
};

export default function UtilityScreen({ onOpenFileManager, onOpenAmbient, fileLibrary }: Props) {
  const { hydrated, filesByFolder } = fileLibrary;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppCard soft>
        <Text style={styles.heading}>Utility</Text>
        <Text style={styles.subtitle}>
          Files you organize are saved on this device, grouped below. Tap a group or a file to open the file manager for
          add, rename, and move actions.
        </Text>
      </AppCard>

      <AppCard>
        <View style={styles.rowSpace}>
          <View style={styles.titleBlock}>
            <Text style={styles.sectionTitle}>Ambient soundscapes</Text>
            <Text style={styles.sectionBody}>
              Lo-fi, rain, or cafe atmospheres with their own player and volume controls.
            </Text>
          </View>
          <Pressable style={styles.secondaryButton} onPress={onOpenAmbient}>
            <Text style={styles.secondaryButtonText}>Open player</Text>
          </Pressable>
        </View>
      </AppCard>

      {!hydrated ? (
        <AppCard>
          <Text style={styles.loadingText}>Loading your library…</Text>
        </AppCard>
      ) : (
        <AppCard>
          <View style={styles.rowSpace}>
            <View style={styles.titleBlock}>
              <Text style={styles.sectionTitle}>Document Library</Text>
              <Text style={styles.sectionBody}>
                Everything in Ungrouped and your folders appears here—including PDFs and other files—even when the phone
                does not supply a visible file type.
              </Text>
            </View>
            <Pressable style={styles.secondaryButton} onPress={onOpenFileManager}>
              <Text style={styles.secondaryButtonText}>File Manager</Text>
            </Pressable>
          </View>

          {filesByFolder.map(folder => (
            <View key={folder.id} style={styles.folderBlock}>
              <Pressable onPress={onOpenFileManager}>
                <View style={styles.rowSpace}>
                  <Text style={styles.folderHeading}>{folder.name}</Text>
                  <Text style={styles.folderCount}>
                    {folder.files.length} file{folder.files.length === 1 ? '' : 's'}
                  </Text>
                </View>
              </Pressable>
              {folder.files.length === 0 ? (
                <Text style={styles.emptyState}>Nothing here yet — add files in File Manager.</Text>
              ) : (
                folder.files.map(file => {
                  const doc = isDocumentFile(file);
                  return (
                    <Pressable key={file.id} style={styles.fileRow} onPress={onOpenFileManager}>
                      <View style={styles.fileBadge}>
                        <Text style={styles.fileBadgeText}>{doc ? 'DOC' : 'FILE'}</Text>
                      </View>
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.displayName || file.name || 'Unnamed file'}
                        </Text>
                        <Text style={styles.fileMeta} numberOfLines={1}>
                          {file.type || 'Unknown type'} ·{' '}
                          {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          ))}
        </AppCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heading: {
    fontSize: typography.section,
    fontWeight: '700',
    color: palette.textStrong,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 23,
  },
  loadingText: {
    color: palette.textMuted,
    fontSize: typography.body,
    fontStyle: 'italic',
  },
  rowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textStrong,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
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
  folderBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  folderHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textStrong,
  },
  folderCount: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    color: palette.textMuted,
    fontSize: typography.body,
    fontStyle: 'italic',
    marginTop: spacing.xs,
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
    minWidth: 0,
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
});
