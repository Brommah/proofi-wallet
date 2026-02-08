import '../src/polyfills'; // Must be first — provides crypto.getRandomValues
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const { isAuthenticated, otpVerified, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    restoreSession().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;

    const inApp = segments[0] === '(app)';
    const onPin = segments[0] === 'pin';

    if (isAuthenticated && !inApp) {
      router.replace('/(app)/wallet');
    } else if (otpVerified && !isAuthenticated && !onPin) {
      router.replace('/pin');
    } else if (!otpVerified && !isAuthenticated && (inApp || onPin)) {
      router.replace('/');
    }
  }, [ready, isAuthenticated, otpVerified, segments]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black }}>
        <ActivityIndicator size="large" color={Colors.cyan} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
      <Slot />
    </>
  );
}
