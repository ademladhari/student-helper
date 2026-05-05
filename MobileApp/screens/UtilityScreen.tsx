import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AppCard from '../src/components/AppCard';
import { isDocumentFile, type FileLibraryApi } from '../src/fileLibrary/useFileLibrary';
import { palette, radius, spacing, typography } from '../src/theme/tokens';
import {
  buildLibraryContextForAi,
  fetchLibraryAiInsights,
} from '../src/utils/libraryGemini';

type Props = {
  onOpenFileManager: () => void;
  fileLibrary: Pick<FileLibraryApi, 'hydrated' | 'filesByFolder'>;
};

export default function UtilityScreen({ onOpenFileManager, fileLibrary }: Props) {
  const { hydrated, filesByFolder } = fileLibrary;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');

  const totalFiles = useMemo(
    () => filesByFolder.reduce((n, folder) => n + folder.files.length, 0),
    [filesByFolder],
  );

  const foldersForAi = useMemo(() => {
    return filesByFolder.map(folder => ({
      name: folder.name,
      files: folder.files.map(file => ({
        title: file.displayName || file.name || 'Untitled file',
        kindHint: isDocumentFile(file) ? 'document-like' : 'other',
      })),
    }));
  }, [filesByFolder]);

  const libraryFingerprint = useMemo(
    () =>
      filesByFolder
        .map(folder => `${folder.id}:${folder.files.map(f => f.id).join(',')}`)
        .join('|'),
    [filesByFolder],
  );

  useEffect(() => {
    setAiSummary('');
    setAiExplanation('');
  }, [libraryFingerprint]);

  async function runLibraryInsights() {
    if (!hydrated || totalFiles === 0) {
      return;
    }

    setAiLoading(true);

    try {
      const context = buildLibraryContextForAi(foldersForAi);
      const { summary, explanation } = await fetchLibraryAiInsights(context);
      setAiSummary(summary);
      setAiExplanation(explanation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load AI insights.';
      Alert.alert('AI insights', message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppCard soft>
        <Text style={styles.heading}>Utility</Text>
        <Text style={styles.subtitle}>
          Files you organize are saved on this device, grouped below. Tap a group or a file to open the file manager for
          add, rename, and move actions.
        </Text>
      </AppCard>

      {hydrated ? (
        <AppCard>
          <Text style={styles.aiCardTitle}>AI library insights</Text>
          <Text style={styles.aiCardHint}>
            Summary and study tips based on folder and file names only—your documents are never uploaded or read.
          </Text>
          <Pressable
            style={[styles.aiButton, totalFiles === 0 && styles.aiButtonDisabled]}
            onPress={runLibraryInsights}
            disabled={aiLoading || totalFiles === 0}>
            {aiLoading ? (
              <View style={styles.aiButtonInner}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.aiButtonTextLoading}>Generating…</Text>
              </View>
            ) : (
              <Text style={styles.aiButtonText}>Generate summary & explanation</Text>
            )}
          </Pressable>
          {totalFiles === 0 ? (
            <Text style={styles.aiEmptyHint}>Add at least one file in File Manager to enable AI overview.</Text>
          ) : null}
          {(aiSummary || aiExplanation) && !aiLoading ? (
            <View style={styles.aiOutput}>
              <Text style={styles.aiOutputLabel}>Summary</Text>
              <Text style={styles.aiOutputBody}>{aiSummary || '—'}</Text>
              <Text style={[styles.aiOutputLabel, styles.aiOutputLabelSpaced]}>Explanation</Text>
              <Text style={styles.aiOutputBody}>{aiExplanation || '—'}</Text>
            </View>
          ) : null}
        </AppCard>
      ) : null}

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
  aiCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textStrong,
    marginBottom: spacing.xs,
  },
  aiCardHint: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  aiButton: {
    alignSelf: 'flex-start',
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minWidth: 220,
    minHeight: 44,
    justifyContent: 'center',
  },
  aiButtonDisabled: {
    opacity: 0.55,
  },
  aiButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  aiButtonTextLoading: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  aiEmptyHint: {
    marginTop: spacing.sm,
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  aiOutput: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  aiOutputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  aiOutputLabelSpaced: {
    marginTop: spacing.md,
  },
  aiOutputBody: {
    marginTop: spacing.xs,
    color: palette.textStrong,
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
