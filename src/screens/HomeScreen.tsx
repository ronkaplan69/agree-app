import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  const { isAuthenticated, user, logout } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

  const colors = {
    background: isDarkMode ? '#1a1a2e' : '#f8f9fa',
    text: isDarkMode ? '#eaeaea' : '#1a1a2e',
    textSecondary: isDarkMode ? '#a0a0a0' : '#6c757d',
    primary: '#6366f1',
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        {isAuthenticated && user ? (
          <>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hello, {user.name || 'there'}!
            </Text>
            <TouchableOpacity onPress={logout}>
              <Text style={[styles.link, { color: colors.primary }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Welcome
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.link, { color: colors.primary }]}>
                Sign In / Register
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Agree</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isAuthenticated
            ? 'Explore and agree with principles'
            : 'Sign in to explore principles'}
        </Text>

        {isAuthenticated && (
          <TouchableOpacity
            style={[
              styles.principlesButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => navigation.navigate('Principles')}
          >
            <Text style={styles.principlesButtonText}>View Principles</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  principlesButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  principlesButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
