import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, radius, spacing, typography } from '../theme/tokens';

type Props = {
  visible: boolean;
  fileName: string;
  uri: string | null;
  onClose: () => void;
};

export default function ImageViewerModal({ visible, fileName, uri, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const imageHeight = Math.max(320, height - 140);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
        </View>

        {uri ? (
          <View style={styles.viewer}>
            <Image
              source={{ uri }}
              style={{ width: width - spacing.lg * 2, height: imageHeight }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.errorText}>This image does not have a valid URI.</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1724',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#152033',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  fileName: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: typography.body,
  },
  viewer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
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
  },
});
