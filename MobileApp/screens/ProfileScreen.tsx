import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../src/components/AppCard';
import { palette, radius, spacing, typography } from '../src/theme/tokens';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  user: AuthUser;
  onOpenTasks: () => void;
  onOpenStats: () => void;
  onSignOut: () => void;
};

export default function ProfileScreen({ user, onOpenTasks, onOpenStats, onSignOut }: Props) {
  const displayName = user.name.trim() || 'Guest';
  const displayEmail = user.email.trim() || 'No email linked yet';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroWrap}>
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <Text style={styles.title}>Your study space.</Text>
        <Text style={styles.subtitle}>
          Review your account, jump to key views, and sign out when you are done.
        </Text>
      </View>

      <AppCard>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{displayEmail}</Text>
            <Text style={styles.id}>User ID: {user.id}</Text>
          </View>
        </View>
      </AppCard>

      <AppCard soft>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <Text style={styles.cardText}>Move to the sections you use most often.</Text>
        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={onOpenTasks}>
            <Text style={styles.actionText}>Tasks</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={onOpenStats}>
            <Text style={styles.actionText}>Stats</Text>
          </Pressable>
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Session</Text>
        <Text style={styles.cardText}>Use sign out to return to the starting state.</Text>
        <Pressable style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: palette.accent,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    color: palette.textStrong,
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.textMuted,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileMeta: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.textStrong,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: palette.textMuted,
    marginBottom: 4,
  },
  id: {
    fontSize: 12,
    color: palette.textMuted,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textStrong,
    marginBottom: spacing.xs,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.textMuted,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionText: {
    color: palette.primary,
    fontWeight: '700',
  },
  signOutButton: {
    borderRadius: radius.md,
    backgroundColor: palette.danger,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
