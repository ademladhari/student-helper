import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { palette, radius, spacing, typography } from '../src/theme/tokens';

type AuthMode = 'signin' | 'signup';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthResult = {
  user: AuthUser;
  token: string;
};

type Props = {
  onAuthenticated: (result: AuthResult) => void;
};

const BACKEND_BASE_URLS =
  (typeof navigator !== 'undefined' && navigator.product === 'ReactNative')
    ? ['http://10.0.2.2:5000', 'http://localhost:5000', 'http://127.0.0.1:5000']
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
  for (const baseUrl of BACKEND_BASE_URLS) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/health`, { method: 'GET' }, 5000);

      if (response.ok) {
        return baseUrl;
      }
    } catch (_error) {
      // Try the next URL.
    }
  }

  throw new Error('Unable to reach the backend. Make sure the API is running.');
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const title = useMemo(() => (mode === 'signin' ? 'Welcome back' : 'Create your account'), [mode]);

  async function handleSubmit() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password.trim()) {
      setErrorMessage('Email and password are required.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMessage('Name is required for sign up.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const baseUrl = await probeBackend();
      const response = await fetchWithTimeout(
        `${baseUrl}/api/auth/${mode}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            mode === 'signup'
              ? { name: name.trim(), email: trimmedEmail, password }
              : { email: trimmedEmail, password },
          ),
        },
        10000,
      );

      const payload = await readResponseBody(response);

      if (!response.ok) {
        const message = typeof payload === 'string' ? payload : payload?.message || 'Authentication failed';
        throw new Error(message);
      }

      onAuthenticated(payload as AuthResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      setErrorMessage(message);
      Alert.alert('Sign in error', message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.backgroundBlobLarge} />
      <View style={styles.backgroundBlobSmall} />

      <View style={styles.heroWrap}>
        <Text style={styles.brand}>SmartStudy</Text>
        <Text style={styles.heroTitle}>Study smarter.</Text>
        <Text style={styles.heroText}>Sign in or sign up to continue.</Text>
        <View style={styles.heroPills}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Tasks</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Focus</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>OCR</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setMode('signin')}
            style={[styles.toggleButton, mode === 'signin' && styles.toggleButtonActive]}>
            <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>Sign In</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('signup')}
            style={[styles.toggleButton, mode === 'signup' && styles.toggleButtonActive]}>
            <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Sign Up</Text>
          </Pressable>
        </View>

        <Text style={styles.formTitle}>{title}</Text>
        <Text style={styles.formSubtitle}>
          {mode === 'signin' ? 'Enter your details.' : 'Create a new account.'}
        </Text>

        {mode === 'signup' ? (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
          />
        ) : null}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor={palette.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={palette.textMuted}
          secureTextEntry
          style={styles.input}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isLoading}>
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Text>
        </Pressable>

        <Text style={styles.footerText}>
          A cleaner start for your study sessions.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    minHeight: '100%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  heroWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  brand: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: palette.textStrong,
    fontSize: 52,
    lineHeight: 54,
    fontWeight: '700',
    letterSpacing: -1.6,
    marginBottom: spacing.sm,
  },
  heroText: {
    color: palette.textMuted,
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 320,
  },
  heroPills: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  heroPill: {
    borderRadius: radius.round,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(72,97,216,0.14)',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  heroPillText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  panel: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
    marginTop: spacing.md,
    minHeight: '68%',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleButton: {
    flex: 1,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingVertical: 16,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  toggleText: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  formTitle: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    color: palette.textStrong,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  input: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#F9FBFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 17,
    color: palette.textStrong,
    marginBottom: spacing.md,
    fontSize: 16,
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.lg,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
  footerText: {
    marginTop: spacing.lg,
    color: palette.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  backgroundBlobLarge: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(72,97,216,0.14)',
  },
  backgroundBlobSmall: {
    position: 'absolute',
    top: 120,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(35,184,154,0.12)',
  },
});