import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Asset, launchCamera } from 'react-native-image-picker';
import AppCard from '../src/components/AppCard';
import { palette, radius, spacing, typography } from '../src/theme/tokens';
import { DeadlineCandidate, TaskDraftInput } from '../src/types/study';
import { extractDeadlineCandidates } from '../src/utils/studyPlanner';
import { getBackendBaseUrls, probeBackend, fetchWithTimeout, readResponseBody } from '../src/utils/backend';

type Props = {
  onCreateDrafts: (candidates: DeadlineCandidate[]) => void;
  onCreateAiDrafts: (drafts: TaskDraftInput[]) => void;
};


async function requestAndroidCameraPermission() {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Camera permission',
      message: 'SmartStudy needs camera access to scan notes and run OCR.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function buildImageFormData(asset: Asset): FormData | null {
  if (!asset.uri) {
    return null;
  }

  const fallbackName = `scan-${Date.now()}.jpg`;
  const fileName = asset.fileName || fallbackName;
  const type = asset.type || 'image/jpeg';

  const formData = new FormData();
  formData.append('image', {
    uri: asset.uri,
    type,
    name: fileName,
  } as never);

  return formData;
}

export default function ScanScreen({ onCreateDrafts, onCreateAiDrafts }: Props) {
  const [scannedText, setScannedText] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<Array<{ id: string; draft: TaskDraftInput }>>([]);
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());

  const candidates = useMemo(() => extractDeadlineCandidates(scannedText), [scannedText]);

  function sanitizePriority(input: string) {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'high' || normalized === 'low' || normalized === 'medium') {
      return normalized as 'low' | 'medium' | 'high';
    }
    return 'medium';
  }

  function minutesToPomodoros(minutes: number) {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(minutes / 25));
  }

  async function generateAiDrafts() {
    if (!scannedText.trim()) {
      Alert.alert('Missing text', 'Scan or paste text before generating AI tasks.');
      return;
    }

    setIsAiProcessing(true);

    try {
      const baseUrl = await probeBackend();
      const endpoint = `${baseUrl}/api/ai/generate-tasks`;

      if (__DEV__) {
        console.log('[AI] Generate drafts via backend', { endpoint });
      }

      const response = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: scannedText }),
        },
        120000,
      );

      const payload = await readResponseBody(response);

      if (!response.ok) {
        const message =
          typeof payload === 'string'
            ? payload
            : payload?.detail || payload?.message || 'AI task generation failed';
        throw new Error(message);
      }

      const items = Array.isArray(payload?.drafts) ? payload.drafts : [];
      if (items.length === 0) {
        throw new Error('AI returned no task drafts.');
      }

      const drafts: Array<{ id: string; draft: TaskDraftInput }> = items.map((item, index) => ({
        id: `ai-draft-${Date.now()}-${index}`,
        draft: {
          title: item.title || 'Untitled task',
          dueDate: new Date(item.dueDate).toISOString(),
          estimatedPomodoros: Math.max(1, Number(item.estimatedPomodoros) || 1),
          priority: sanitizePriority(item.priority || 'medium'),
        },
      }));

      setAiDrafts(drafts);
      setSelectedDrafts(new Set(drafts.map(draft => draft.id)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not generate AI tasks.';
      Alert.alert('AI error', message);
    } finally {
      setIsAiProcessing(false);
    }
  }

  function toggleDraftSelection(id: string) {
    setSelectedDrafts(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function confirmSelectedDrafts() {
    const selected = aiDrafts.filter(draft => selectedDrafts.has(draft.id)).map(draft => draft.draft);
    if (selected.length === 0) {
      Alert.alert('No drafts selected', 'Select at least one task to add to your list.');
      return;
    }

    onCreateAiDrafts(selected);
    setAiDrafts([]);
    setSelectedDrafts(new Set());
  }

  async function openCameraAndExtract() {
    try {
      console.log('[OCR] Starting capture flow', {
        baseUrls: getBackendBaseUrls(),
        platform: Platform.OS,
      });

      const hasPermission = await requestAndroidCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Please allow camera permission to scan notes.');
        return;
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.9,
        saveToPhotos: false,
      });

      if (result.errorCode) {
        Alert.alert('Camera error', result.errorMessage || result.errorCode);
        return;
      }

      if (result.didCancel) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset) {
        Alert.alert('Capture failed', 'No image was captured.');
        return;
      }

      const formData = buildImageFormData(asset);
      if (!formData) {
        Alert.alert('Invalid image', 'Could not prepare image upload payload.');
        return;
      }

      setImageUri(asset.uri || '');
      setIsProcessing(true);

      let baseUrl: string;

      try {
        baseUrl = await probeBackend();
      } catch (probeError) {
        const message = probeError instanceof Error ? probeError.message : 'Backend is not reachable.';
        console.error('[OCR] Backend probe failed', {
          baseUrls: getBackendBaseUrls(),
          error: message,
        });
        throw new Error(`Backend connection failed before OCR upload: ${message}`);
      }

      const OCR_ENDPOINT = `${baseUrl}/api/ocr/extract`;
      const BACKEND_HEALTH_ENDPOINT = `${baseUrl}/api/health`;

      console.log('[OCR] Uploading image for OCR', {
        endpoint: OCR_ENDPOINT,
        healthEndpoint: BACKEND_HEALTH_ENDPOINT,
        fileName: asset.fileName,
        mimeType: asset.type,
        uri: asset.uri,
      });

      const response = await fetchWithTimeout(
        OCR_ENDPOINT,
        {
        method: 'POST',
        body: formData,
        },
        120000,
      );

      const payload = await readResponseBody(response);

      console.log('[OCR] OCR response received', {
        status: response.status,
        ok: response.ok,
        payload,
      });

      if (!response.ok) {
        const errorMessage =
          typeof payload === 'string'
            ? payload
            : payload?.detail || payload?.message || 'OCR request failed';
        throw new Error(errorMessage);
      }

      const extractedText = typeof payload === 'string' ? payload : payload.text || '';

      setScannedText(extractedText);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not process image.';
      console.error('[OCR] Failed', error);
      Alert.alert('OCR failed', message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppCard soft>
        <Text style={styles.heading}>Scan and Extract</Text>
        <Text style={styles.subtitle}>Capture your notes with camera, run OCR, and generate deadline drafts.</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Camera OCR</Text>
        <View style={styles.actions}>
          <Pressable onPress={openCameraAndExtract} style={styles.primaryButton} disabled={isProcessing}>
            <Text style={styles.primaryButtonText}>{isProcessing ? 'Processing...' : 'Open Camera and Scan'}</Text>
          </Pressable>
        </View>

        {isProcessing ? (
          <View style={styles.processingRow}>
            <ActivityIndicator color={palette.primary} size="small" />
            <Text style={styles.processingText}>Running OCR on captured image...</Text>
          </View>
        ) : null}


        {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : null}
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Extracted Text</Text>
        <TextInput
          value={scannedText}
          onChangeText={setScannedText}
          multiline
          placeholder="Captured OCR text appears here..."
          style={styles.input}
          placeholderTextColor={palette.textMuted}
        />

        <View style={styles.actions}>
          <Pressable
            onPress={generateAiDrafts}
            disabled={!scannedText.trim() || isAiProcessing}
            style={[styles.primaryButton, (!scannedText.trim() || isAiProcessing) && styles.disabledButton]}>
            <Text style={styles.primaryButtonText}>
              {isAiProcessing ? 'Generating AI Drafts...' : 'Generate AI Drafts'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onCreateDrafts(candidates)}
            disabled={candidates.length === 0}
            style={[styles.secondaryButton, candidates.length === 0 && styles.disabledButton]}>
            <Text style={styles.secondaryButtonText}>Use Quick Drafts</Text>
          </Pressable>
        </View>
      </AppCard>

      {aiDrafts.length > 0 ? (
        <AppCard>
          <Text style={styles.sectionTitle}>AI Drafts (confirm to add)</Text>
          {aiDrafts.map(draftItem => (
            <Pressable
              key={draftItem.id}
              onPress={() => toggleDraftSelection(draftItem.id)}
              style={styles.draftRow}>
              <View style={[styles.draftCheck, selectedDrafts.has(draftItem.id) && styles.draftCheckActive]}>
                <Text style={[styles.draftCheckText, selectedDrafts.has(draftItem.id) && styles.draftCheckTextActive]}>
                  {selectedDrafts.has(draftItem.id) ? '✓' : ''}
                </Text>
              </View>
              <View style={styles.draftInfo}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {draftItem.draft.title}
                </Text>
                <Text style={styles.muted}>
                  Due {new Date(draftItem.draft.dueDate).toLocaleDateString()} • {draftItem.draft.estimatedPomodoros}x Pomodoro • {draftItem.draft.priority.toUpperCase()} priority
                </Text>
              </View>
            </Pressable>
          ))}
          <Pressable style={styles.primaryButton} onPress={confirmSelectedDrafts}>
            <Text style={styles.primaryButtonText}>Add Selected Tasks</Text>
          </Pressable>
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={styles.sectionTitle}>Deadline Candidates ({candidates.length})</Text>
        {candidates.length === 0 ? <Text style={styles.muted}>No date-like lines detected yet.</Text> : null}
        {candidates.map(candidate => (
          <View key={`${candidate.title}-${candidate.dueDate}`} style={styles.candidateRow}>
            <Text style={styles.taskTitle}>{candidate.title}</Text>
            <Text style={styles.muted}>Due {new Date(candidate.dueDate).toLocaleDateString()}</Text>
            <Text style={styles.confidence}>Confidence: {Math.round(candidate.confidence * 100)}%</Text>
          </View>
        ))}
      </AppCard>
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textStrong,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 110,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#F9FBFF',
    padding: spacing.md,
    color: palette.textStrong,
    textAlignVertical: 'top',
    fontSize: typography.body,
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: palette.primarySoft,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: palette.primary,
    fontWeight: '700',
  },
  candidateRow: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  processingText: {
    color: palette.textMuted,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.sm,
  },
  taskTitle: {
    color: palette.textStrong,
    fontSize: typography.body,
    marginBottom: 2,
  },
  muted: {
    color: palette.textMuted,
    fontSize: 13,
  },
  confidence: {
    color: palette.accent,
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  draftCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  draftCheckActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  draftCheckText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  draftCheckTextActive: {
    color: '#FFFFFF',
  },
  draftInfo: {
    flex: 1,
  },
  warningText: {
    color: palette.warning,
    backgroundColor: '#FFF3DB',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F1D29B',
  },
});
