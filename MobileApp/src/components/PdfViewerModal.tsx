import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { palette, radius, spacing, typography } from '../theme/tokens';

type Props = {
  visible: boolean;
  fileName: string;
  uri: string | null;
  onClose: () => void;
};

export default function PdfViewerModal({ visible, fileName, uri, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setPage(1);
      setTotalPages(0);
      setIsLoading(true);
      setErrorMessage(null);
    }
  }, [visible, uri]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.fileName} numberOfLines={1}>
              {fileName}
            </Text>
            {totalPages > 0 ? (
              <Text style={styles.pageMeta}>
                Page {page} of {totalPages}
              </Text>
            ) : null}
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : uri ? (
          <View style={styles.viewerWrap}>
            {isLoading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={palette.primary} />
                <Text style={styles.loadingText}>Loading PDF…</Text>
              </View>
            ) : null}
            <Pdf
              source={{ uri, cache: false }}
              trustAllCerts={false}
              onLoadComplete={numberOfPages => {
                setTotalPages(numberOfPages);
                setIsLoading(false);
              }}
              onPageChanged={nextPage => setPage(nextPage)}
              onError={error => {
                const message =
                  typeof error === 'object' &&
                  error !== null &&
                  'message' in error &&
                  typeof (error as { message?: string }).message === 'string'
                    ? (error as { message: string }).message
                    : 'Could not open this PDF.';
                setErrorMessage(message);
                setIsLoading(false);
              }}
              style={[styles.pdf, { width, height: height - 120 }]}
              enablePaging
              spacing={8}
              fitPolicy={0}
            />
          </View>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.errorText}>This file does not have a valid URI.</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.surface,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceSoft,
  },
  closeButtonText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    color: palette.textStrong,
    fontWeight: '700',
    fontSize: typography.body,
  },
  pageMeta: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  viewerWrap: {
    flex: 1,
    backgroundColor: '#E8EDF5',
  },
  pdf: {
    flex: 1,
    backgroundColor: '#E8EDF5',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
    zIndex: 1,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: palette.textMuted,
    fontSize: typography.body,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: palette.danger,
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
