import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants/theme';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.cyan,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'WALLET',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>💎</Text>,
        }}
      />
      <Tabs.Screen
        name="proofi"
        options={{
          title: 'PROOFI',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔐</Text>,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'VAULT',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔒</Text>,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'SCAN',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📷</Text>,
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          title: 'GAME',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚡</Text>,
        }}
      />
    </Tabs>
  );
}
