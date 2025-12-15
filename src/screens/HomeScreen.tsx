import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../theme/colors';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  const { isAuthenticated, user, logout } = useAuth();
  const colors = useColors();

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
          <>
            <TouchableOpacity
              style={[
                styles.principlesButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => navigation.navigate('Principles')}
            >
              <Text style={styles.principlesButtonText}>View Principles</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, { borderColor: colors.border }]}
              onPress={() => navigation.navigate('MyPrinciples')}
            >
              <Text style={[styles.statusButtonText, { color: colors.text }]}>
                My Principles
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, { borderColor: colors.border }]}
              onPress={() => navigation.navigate('Status')}
            >
              <Text style={[styles.statusButtonText, { color: colors.text }]}>
                Status & TBDs
              </Text>
            </TouchableOpacity>
          </>
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
  statusButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
