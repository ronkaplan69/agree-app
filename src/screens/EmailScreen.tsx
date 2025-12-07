import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { countriesApi, Country } from '../api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Email'>;
};

export function EmailScreen({ navigation }: Props) {
  const { requestCode } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

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

  // Country state
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const colors = {
    background: isDarkMode ? '#1a1a2e' : '#f8f9fa',
    card: isDarkMode ? '#16213e' : '#ffffff',
    text: isDarkMode ? '#eaeaea' : '#1a1a2e',
    textSecondary: isDarkMode ? '#a0a0a0' : '#6c757d',
    inputBg: isDarkMode ? '#1a1a2e' : '#f8f9fa',
    inputBorder: isDarkMode ? '#2d3748' : '#e2e8f0',
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    modalBg: isDarkMode ? '#16213e' : '#ffffff',
  };

  // Load countries and detect user's country
  useEffect(() => {
    const loadCountries = async () => {
      try {
        // Load all countries
        const countriesResult = await countriesApi.getAll();
        if (countriesResult.status === 'success' && countriesResult.data) {
          setCountries(countriesResult.data.countries);
        }

        // Detect user's country
        const detectResult = await countriesApi.detect();
        if (detectResult.status === 'success' && detectResult.data?.country) {
          setSelectedCountry(detectResult.data.country);
        }
      } catch (error) {
        console.log('Failed to load countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    loadCountries();
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

  const filteredCountries = countries.filter(
    c =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()),
  );

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
    const result = await requestCode(
      email.trim(),
      name.trim(),
      parseInt(birthYear, 10),
      selectedCountry.code,
    );
    setIsLoading(false);

    if (result.success) {
      navigation.navigate('VerifyCode', { email: email.trim() });
    } else {
      Alert.alert('Error', result.error || 'Failed to send verification code');
    }
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        { borderBottomColor: colors.inputBorder },
        selectedCountry?.code === item.code && {
          backgroundColor: colors.primary + '20',
        },
      ]}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryPicker(false);
        setCountrySearch('');
      }}
    >
      <Text style={[styles.countryName, { color: colors.text }]}>
        {item.name}
      </Text>
      <Text style={[styles.countryCode, { color: colors.textSecondary }]}>
        {item.code}
      </Text>
    </TouchableOpacity>
  );

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
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
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
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
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
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="1990"
              placeholderTextColor={colors.textSecondary}
              value={birthYear}
              onChangeText={setBirthYear}
              keyboardType="number-pad"
              maxLength={4}
              editable={!isLoading}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Country *
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.pickerButton,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
              onPress={() => setShowCountryPicker(true)}
              disabled={isLoading || isLoadingCountries}
            >
              {isLoadingCountries ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : selectedCountry ? (
                <Text style={[styles.pickerText, { color: colors.text }]}>
                  {selectedCountry.name}
                </Text>
              ) : (
                <Text
                  style={[styles.pickerText, { color: colors.textSecondary }]}
                >
                  Select your country
                </Text>
              )}
              <Text
                style={[styles.pickerArrow, { color: colors.textSecondary }]}
              >
                ▼
              </Text>
            </TouchableOpacity>

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

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View
          style={[styles.modalContainer, { backgroundColor: colors.modalBg }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Country
            </Text>
            <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            placeholder="Search countries..."
            placeholderTextColor={colors.textSecondary}
            value={countrySearch}
            onChangeText={setCountrySearch}
            autoCorrect={false}
          />

          <FlatList
            data={filteredCountries}
            keyExtractor={item => item.code}
            renderItem={renderCountryItem}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 16,
  },
  pickerArrow: {
    fontSize: 12,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    margin: 15,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  countryName: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 14,
  },
});
