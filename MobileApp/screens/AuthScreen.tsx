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
import { palette, radius, spacing } from '../src/theme/tokens';

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
  typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
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

  return null;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const title = useMemo(() => (mode === 'signin' ? 'Welcome back' : 'Create your account'), [mode]);

  async function submitAuth() {
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

      if (!baseUrl) {
        throw new Error('Unable to reach the backend. Make sure the API is running.');
      }

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
      Alert.alert('Authentication error', message);
    } finally {
      setIsLoading(false);
    }
  }

  function useGuestMode() {
    onAuthenticated({
      user: { id: 'guest', name: 'Guest', email: '' },
      token: 'guest-token',
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroWrap}>
        <Text style={styles.brand}>SmartStudy</Text>
        <Text style={styles.heroTitle}>Study smarter.</Text>
        <Text style={styles.heroText}>Sign in or sign up to continue.</Text>
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

        <Pressable style={styles.primaryButton} onPress={submitAuth} disabled={isLoading}>
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={useGuestMode}
          disabled={isLoading}>
          <Text style={styles.secondaryButtonText}>Enter as Guest</Text>
        </Pressable>
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
    backgroundColor: palette.background,
  },
  heroWrap: {
    marginBottom: spacing.lg,
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: palette.primary,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: palette.textStrong,
    marginBottom: spacing.sm,
  },
  heroText: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.textMuted,
  },
  panel: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceSoft,
    borderRadius: radius.round,
    padding: 4,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.round,
  },
  toggleButtonActive: {
    backgroundColor: palette.surface,
  },
  toggleText: {
    color: palette.textMuted,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: palette.primary,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textStrong,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: palette.textMuted,
    marginBottom: spacing.md,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.textStrong,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: palette.danger,
    marginBottom: spacing.sm,
    fontSize: 13,
  },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: palette.textStrong,
    fontWeight: '800',
  },
});
