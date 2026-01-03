import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { countriesApi, Country } from '../api';
import { locationService } from '../services/locationService';
import {
  searchCities,
  searchStates,
  extractCity,
  extractState,
  type GeocodingResult,
} from '../services/mapboxGeocoding';
import { useColors } from '../theme/colors';
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

  const pickerButtonStyle = useMemo(
    () => ({
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
    }),
    [colors.inputBg, colors.inputBorder],
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

  // Country state
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Optional location fields
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationEdited, setLocationEdited] = useState(false);
  const [detectedLocationData, setDetectedLocationData] = useState<{
    city?: string;
    state?: string;
    lat?: number;
    lon?: number;
  } | null>(null);

  // Autocomplete state
  const [citySuggestions, setCitySuggestions] = useState<GeocodingResult[]>([]);
  const [stateSuggestions, setStateSuggestions] = useState<GeocodingResult[]>(
    [],
  );
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [selectedLocationCoords, setSelectedLocationCoords] = useState<{
    lat?: number;
    lon?: number;
  } | null>(null);

  // Debounce timer for search
  const [citySearchTimer, setCitySearchTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [stateSearchTimer, setStateSearchTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Track previous country code to only clear when country actually changes (not on initial set)
  const previousCountryCode = useRef<string | null>(null);

  // Load countries and detect user's country and location
  useEffect(() => {
    const loadCountriesAndLocation = async () => {
      try {
        // Load all countries
        const countriesResult = await countriesApi.getAll();
        let loadedCountries: Country[] = [];
        if (countriesResult.status === 'success' && countriesResult.data) {
          loadedCountries = countriesResult.data.countries;
          setCountries(loadedCountries);
        }

        // Detect detailed location from IP (country, city, state)
        const locationData = await locationService.detectFromIP();
        let countryFromLocation: Country | null = null;

        if (
          locationData &&
          locationData.countryCode &&
          loadedCountries.length > 0
        ) {
          // Match country from location service
          const matchedCountry = loadedCountries.find(
            c => c.code === locationData.countryCode,
          );
          if (matchedCountry) {
            countryFromLocation = matchedCountry;
            setSelectedCountry(matchedCountry);
          }
        }

        // Fallback: Detect user's country from backend if location service didn't find it
        if (!countryFromLocation) {
          const detectResult = await countriesApi.detect();
          if (detectResult.status === 'success' && detectResult.data?.country) {
            setSelectedCountry(detectResult.data.country);
          }
        }

        // Pre-fill city and state from location service if available
        if (locationData) {
          if (locationData.city) {
            setCity(locationData.city);
          }
          if (locationData.regionName) {
            setState(locationData.regionName);
          }
          setLocationDetected(true);
          // Store detected location data for later use
          setDetectedLocationData({
            city: locationData.city || undefined,
            state: locationData.regionName || undefined,
            lat: locationData.lat,
            lon: locationData.lon,
          });
        }

        // Store the country code that was set during initial load
        // This will be updated in the useEffect below
      } catch (error) {
        console.log('Failed to load countries or location:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    loadCountriesAndLocation();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (citySearchTimer) clearTimeout(citySearchTimer);
      if (stateSearchTimer) clearTimeout(stateSearchTimer);
    };
  }, [citySearchTimer, stateSearchTimer]);

  // Clear location fields when country changes (but not on initial set from null)
  useEffect(() => {
    const currentCountryCode = selectedCountry?.code || null;

    // Only clear if country actually changed from one country to another
    // (not when setting initial country from null/undefined)
    if (
      previousCountryCode.current !== null &&
      currentCountryCode !== null &&
      previousCountryCode.current !== currentCountryCode
    ) {
      // User manually changed country - clear location fields
      setCity('');
      setState('');
      setLocationDetected(false);
      setLocationEdited(false);
      setDetectedLocationData(null);
      setSelectedLocationCoords(null);
      setCitySuggestions([]);
      setStateSuggestions([]);
      setShowCitySuggestions(false);
      setShowStateSuggestions(false);
    }

    // Update previous country code
    previousCountryCode.current = currentCountryCode;
  }, [selectedCountry?.code]);

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

  // Handle city input with autocomplete
  const handleCityChange = (text: string) => {
    setCity(text);
    setLocationEdited(true);
    setShowCitySuggestions(true);

    // Clear previous timer
    if (citySearchTimer) {
      clearTimeout(citySearchTimer);
    }

    // If empty, clear suggestions
    if (!text.trim()) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setSelectedLocationCoords(null);
      return;
    }

    // Debounce search
    if (selectedCountry && text.trim().length >= 2) {
      const timer = setTimeout(async () => {
        const results = await searchCities(text.trim(), selectedCountry.code);
        setCitySuggestions(results);
      }, 300);
      setCitySearchTimer(timer);
    }
  };

  // Handle state input with autocomplete
  const handleStateChange = (text: string) => {
    setState(text);
    setLocationEdited(true);
    setShowStateSuggestions(true);

    // Clear previous timer
    if (stateSearchTimer) {
      clearTimeout(stateSearchTimer);
    }

    // If empty, clear suggestions
    if (!text.trim()) {
      setStateSuggestions([]);
      setShowStateSuggestions(false);
      return;
    }

    // Debounce search
    if (selectedCountry && text.trim().length >= 2) {
      const timer = setTimeout(async () => {
        const results = await searchStates(text.trim(), selectedCountry.code);
        setStateSuggestions(results);
      }, 300);
      setStateSearchTimer(timer);
    }
  };

  // Handle city selection from autocomplete
  const handleCitySelect = (result: GeocodingResult) => {
    const cityName = extractCity(result) || result.text;
    setCity(cityName);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
    setLocationEdited(true);

    // Extract and set coordinates
    if (result.center && result.center.length === 2) {
      setSelectedLocationCoords({
        lon: result.center[0],
        lat: result.center[1],
      });
    }

    // Try to extract state from the result
    const stateName = extractState(result);
    if (stateName && !state) {
      setState(stateName);
    }
  };

  // Handle state selection from autocomplete
  const handleStateSelect = (result: GeocodingResult) => {
    const stateName = extractState(result) || result.text;
    setState(stateName);
    setShowStateSuggestions(false);
    setStateSuggestions([]);
    setLocationEdited(true);
  };

  // Clear city field
  const clearCity = () => {
    setCity('');
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    setLocationEdited(true);
    // Clear coordinates if city was the source
    if (selectedLocationCoords && !state) {
      setSelectedLocationCoords(null);
    }
  };

  // Clear state field
  const clearState = () => {
    setState('');
    setStateSuggestions([]);
    setShowStateSuggestions(false);
    setLocationEdited(true);
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

    // Prepare location data for submission
    // Only include data that will help display on WorldMap
    // Country is already sent separately, so we include city, state, and coordinates
    const locationData: {
      city?: string;
      state?: string;
      lat?: number;
      lon?: number;
    } = {};

    if (!locationEdited) {
      // User didn't edit - use detected location data if available
      if (detectedLocationData) {
        if (detectedLocationData.city)
          locationData.city = detectedLocationData.city;
        if (detectedLocationData.state)
          locationData.state = detectedLocationData.state;
        if (detectedLocationData.lat !== undefined)
          locationData.lat = detectedLocationData.lat;
        if (detectedLocationData.lon !== undefined)
          locationData.lon = detectedLocationData.lon;
      }
    } else {
      // User edited - use current field values and coordinates from autocomplete
      if (city.trim()) locationData.city = city.trim();
      if (state.trim()) locationData.state = state.trim();
      // Use coordinates from autocomplete selection if available
      if (selectedLocationCoords) {
        if (selectedLocationCoords.lat !== undefined)
          locationData.lat = selectedLocationCoords.lat;
        if (selectedLocationCoords.lon !== undefined)
          locationData.lon = selectedLocationCoords.lon;
      }
    }

    // Log location data that will be sent
    console.log('Location data to send:', locationData);
    console.log('Detected location data:', detectedLocationData);
    console.log('Location data keys count:', Object.keys(locationData).length);

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

            <Text style={[styles.label, { color: colors.text }]}>
              Country *
            </Text>
            <TouchableOpacity
              style={[styles.input, styles.pickerButton, pickerButtonStyle]}
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

            {/* Optional Location Fields */}
            <View
              style={[
                styles.optionalSection,
                { borderTopColor: colors.inputBorder },
              ]}
            >
              <Text style={[styles.label, { color: colors.text }]}>
                City
                {locationDetected && city && !locationEdited && (
                  <Text
                    style={[styles.autoDetected, { color: colors.primary }]}
                  >
                    {' '}
                    • Auto-detected
                  </Text>
                )}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    inputStyle,
                    showCitySuggestions &&
                      citySuggestions.length > 0 && {
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                  ]}
                  placeholder={
                    selectedCountry
                      ? `City in ${selectedCountry.name}`
                      : 'Select country first'
                  }
                  placeholderTextColor={colors.textSecondary}
                  value={city}
                  onChangeText={handleCityChange}
                  onFocus={() => {
                    if (city.trim().length >= 2 && citySuggestions.length > 0) {
                      setShowCitySuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow selection
                    setTimeout(() => setShowCitySuggestions(false), 200);
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading && !!selectedCountry}
                />
                {city ? (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearCity}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text
                      style={[
                        styles.clearButtonText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {showCitySuggestions && citySuggestions.length > 0 && (
                <View
                  style={[
                    styles.suggestionsContainer,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <FlatList
                    data={citySuggestions}
                    keyExtractor={item => item.id}
                    // scrollEnabled={false} // TODO: without this we get: VirtualizedLists should never be nested inside plain ScrollViews with the same orientation
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.suggestionItem,
                          { borderBottomColor: colors.inputBorder },
                        ]}
                        onPress={() => handleCitySelect(item)}
                      >
                        <Text
                          style={[
                            styles.suggestionText,
                            { color: colors.text },
                          ]}
                        >
                          {item.text}
                        </Text>
                        {item.place_name !== item.text && (
                          <Text
                            style={[
                              styles.suggestionSubtext,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {item.place_name}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  />
                </View>
              )}

              <Text style={[styles.label, { color: colors.text }]}>
                State / Region
                {locationDetected && state && !locationEdited && (
                  <Text
                    style={[styles.autoDetected, { color: colors.primary }]}
                  >
                    {' '}
                    • Auto-detected
                  </Text>
                )}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    inputStyle,
                    showStateSuggestions &&
                      stateSuggestions.length > 0 && {
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                  ]}
                  placeholder={
                    selectedCountry
                      ? `State/Region in ${selectedCountry.name}`
                      : 'Select country first'
                  }
                  placeholderTextColor={colors.textSecondary}
                  value={state}
                  onChangeText={handleStateChange}
                  onFocus={() => {
                    if (
                      state.trim().length >= 2 &&
                      stateSuggestions.length > 0
                    ) {
                      setShowStateSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow selection
                    setTimeout(() => setShowStateSuggestions(false), 200);
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading && !!selectedCountry}
                />
                {state ? (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearState}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text
                      style={[
                        styles.clearButtonText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {showStateSuggestions && stateSuggestions.length > 0 && (
                <View
                  style={[
                    styles.suggestionsContainer,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <FlatList
                    data={stateSuggestions}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.suggestionItem,
                          { borderBottomColor: colors.inputBorder },
                        ]}
                        onPress={() => handleStateSelect(item)}
                      >
                        <Text
                          style={[
                            styles.suggestionText,
                            { color: colors.text },
                          ]}
                        >
                          {item.text}
                        </Text>
                        {item.place_name !== item.text && (
                          <Text
                            style={[
                              styles.suggestionSubtext,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {item.place_name}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  />
                </View>
              )}
            </View>

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
            style={[styles.searchInput, inputStyle]}
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
  optionalSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  optionalHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionalHint: {
    fontSize: 13,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  autoDetected: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    zIndex: 1,
  },
  clearButtonText: {
    fontSize: 18,
    fontWeight: '300',
  },
  suggestionsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: -1,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
});
