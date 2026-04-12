import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Country } from '../api';
import { useColors } from '../theme/colors';
import {
  CountryLocationFields,
  type LocationData,
} from '../components/CountryLocationFields';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export function RegisterScreen({ navigation }: Props) {
  const { requestCode } = useAuth();
  const colors = useColors();

  // Memoized style objects to reduce inline style repetition
  const inputStyle = useMemo(
    () => ({
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
      color: colors.text,
    }),
    [colors.inputBg, colors.inputBorder, colors.text],
  );

  const currentYear = new Date().getFullYear();

  // Test defaults (remove for production)
  const [email, setEmail] = useState('ronkaplan69@gmail.com');
  const [name, setName] = useState(
    'TestUser' + Math.floor(Math.random() * 1000),
  );
  const [birthYear, setBirthYear] = useState(
    String(1980 + Math.floor(Math.random() * 25)),
  );
  const [isLoading, setIsLoading] = useState(false);

  // Country and location state
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [locationData, setLocationData] = useState<LocationData>({});

  // Stable callbacks for CountryLocationFields
  const handleCountryChange = useCallback((country: Country | null) => {
    setSelectedCountry(country);
  }, []);

  const handleLocationDataChange = useCallback((data: LocationData) => {
    setLocationData(data);
  }, []);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const minAge = 12;
  const maxBirthYear = currentYear - minAge;

  const isValidBirthYear = (year: string) => {
    const yearNum = parseInt(year, 10);
    return !isNaN(yearNum) && yearNum >= 1900 && yearNum <= maxBirthYear;
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name or nickname');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }

    if (!birthYear.trim()) {
      Alert.alert('Error', 'Please enter your birth year');
      return;
    }

    if (!isValidBirthYear(birthYear)) {
      Alert.alert(
        'Error',
        `You must be at least ${minAge} years old (birth year 1900-${maxBirthYear})`,
      );
      return;
    }

    if (!selectedCountry) {
      Alert.alert('Error', 'Please select your country');
      return;
    }

    setIsLoading(true);
    // Send location data if we have any location information
    const locationToSend =
      Object.keys(locationData).length > 0 ? locationData : undefined;
    const result = await requestCode(
      email.trim(),
      name.trim(),
      parseInt(birthYear, 10),
      selectedCountry.code,
      locationToSend,
    );
    setIsLoading(false);

    if (result.success) {
      navigation.navigate('VerifyCode', {
        email: email.trim(),
        bypass: result.bypass,
      });
    } else {
      Alert.alert('Error', result.error || 'Failed to send verification code');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Register</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Create your account
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isLoading}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Name or Nickname *
            </Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="What should we call you?"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Birth Year *
            </Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="1990"
              placeholderTextColor={colors.textSecondary}
              value={birthYear}
              onChangeText={setBirthYear}
              keyboardType="number-pad"
              maxLength={4}
              editable={!isLoading}
            />

            <CountryLocationFields
              selectedCountry={selectedCountry}
              onCountryChange={handleCountryChange}
              onLocationDataChange={handleLocationDataChange}
              disabled={isLoading}
            />

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
