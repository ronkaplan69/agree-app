import React from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
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
  MyPrinciplesScreen,
  PrincipleDetailScreen,
  StatusScreen,
} from './src/screens';
import { useColors } from './src/theme/colors';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isLoading } = useAuth();
  const colors = useColors();

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
        dark: colors.isDarkMode,
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
        <Stack.Screen
          name="MyPrinciples"
          component={MyPrinciplesScreen}
          options={{ title: 'My Principles' }}
        />
        <Stack.Screen
          name="PrincipleDetail"
          component={PrincipleDetailScreen}
          options={{ title: 'Principle' }}
        />
        <Stack.Screen
          name="Status"
          component={StatusScreen}
          options={{ title: 'Status & TBDs' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  const colors = useColors();

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={colors.isDarkMode ? 'light-content' : 'dark-content'}
      />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
