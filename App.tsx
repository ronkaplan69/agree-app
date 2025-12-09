import React from 'react';
import {
  StatusBar,
  useColorScheme,
  ActivityIndicator,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import {
  HomeScreen,
  EmailScreen,
  LoginScreen,
  VerifyCodeScreen,
  PrinciplesScreen,
} from './src/screens';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isLoading } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

  const colors = {
    background: isDarkMode ? '#1a1a2e' : '#f8f9fa',
    card: isDarkMode ? '#16213e' : '#ffffff',
    text: isDarkMode ? '#eaeaea' : '#1a1a2e',
    border: isDarkMode ? '#2d3748' : '#e2e8f0',
    primary: '#6366f1',
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDarkMode,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Email"
          component={EmailScreen}
          options={{ title: 'Register' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Sign In' }}
        />
        <Stack.Screen
          name="VerifyCode"
          component={VerifyCodeScreen}
          options={{ title: '' }}
        />
        <Stack.Screen
          name="Principles"
          component={PrinciplesScreen}
          options={{ title: 'Principles' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
