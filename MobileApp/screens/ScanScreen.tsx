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
import { DeadlineCandidate } from '../src/types/study';
import { extractDeadlineCandidates } from '../src/utils/studyPlanner';

type Props = {
  onCreateDrafts: (candidates: DeadlineCandidate[]) => void;
};

const BACKEND_BASE_URLS =
  Platform.OS === 'android'
    ? ['http://192.168.1.23:5000', 'http://127.0.0.1:5000', 'http://localhost:5000', 'http://10.0.2.2:5000']
    : ['http://localhost:5000'];

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function probeBackend() {
  const errors: string[] = [];

  for (const baseUrl of BACKEND_BASE_URLS) {
    const endpoint = `${baseUrl}/api/health`;

    try {
      const response = await fetchWithTimeout(endpoint, { method: 'GET' }, 5000);

      if (response.ok) {
        return baseUrl;
      }

      const body = await readResponseBody(response);
      errors.push(
        `${endpoint} -> ${response.status} (${typeof body === 'string' ? body : JSON.stringify(body)})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown network error';
      errors.push(`${endpoint} -> ${message}`);
    }
  }

  throw new Error(`Unable to reach backend. Tried: ${errors.join(' | ')}`);
}

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

export default function ScanScreen({ onCreateDrafts }: Props) {
  const [scannedText, setScannedText] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const candidates = useMemo(() => extractDeadlineCandidates(scannedText), [scannedText]);

  async function openCameraAndExtract() {
    try {
      console.log('[OCR] Starting capture flow', {
        baseUrls: BACKEND_BASE_URLS,
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
          baseUrls: BACKEND_BASE_URLS,
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
            onPress={() => onCreateDrafts(candidates)}
            disabled={candidates.length === 0}
            style={[styles.primaryButton, candidates.length === 0 && styles.disabledButton]}>
            <Text style={styles.primaryButtonText}>Create Task Drafts</Text>
          </Pressable>
        </View>
      </AppCard>

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
