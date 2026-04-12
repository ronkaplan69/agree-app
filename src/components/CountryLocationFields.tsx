import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
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

export type LocationData = {
  city?: string;
  state?: string;
  lat?: number;
  lon?: number;
};

type Props = {
  selectedCountry: Country | null;
  onCountryChange: (country: Country | null) => void;
  onLocationDataChange: (data: LocationData) => void;
  disabled?: boolean;
};

export function CountryLocationFields({
  selectedCountry,
  onCountryChange,
  onLocationDataChange,
  disabled = false,
}: Props) {
  const colors = useColors();

  // Country state
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Location fields state
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationEdited, setLocationEdited] = useState(false);
  const [detectedLocationData, setDetectedLocationData] =
    useState<LocationData | null>(null);

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

  // Debounce timers for search
  const [citySearchTimer, setCitySearchTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [stateSearchTimer, setStateSearchTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Track previous country code to only clear when country actually changes
  const previousCountryCode = useRef<string | null>(null);

  // Memoized style objects
  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const pickerButtonStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
  };

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
            onCountryChange(matchedCountry);
          }
        }

        // Fallback: Detect user's country from backend if location service didn't find it
        if (!countryFromLocation) {
          const detectResult = await countriesApi.detect();
          if (detectResult.status === 'success' && detectResult.data?.country) {
            onCountryChange(detectResult.data.country);
          }
        }

        // Pre-fill city and state from location service if available
        if (locationData) {
          const detectedData: LocationData = {};
          if (locationData.city) {
            setCity(locationData.city);
            detectedData.city = locationData.city;
          }
          if (locationData.regionName) {
            setState(locationData.regionName);
            detectedData.state = locationData.regionName;
          }
          if (locationData.lat !== undefined) {
            detectedData.lat = locationData.lat;
          }
          if (locationData.lon !== undefined) {
            detectedData.lon = locationData.lon;
          }
          setLocationDetected(true);
          setDetectedLocationData(detectedData);
          onLocationDataChange(detectedData);
        }
      } catch (error) {
        console.log('Failed to load countries or location:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    loadCountriesAndLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      onLocationDataChange({});
    }

    // Update previous country code
    previousCountryCode.current = currentCountryCode;
  }, [selectedCountry?.code, onLocationDataChange]);

  // Update parent location data when fields change
  useEffect(() => {
    const updateLocationData = () => {
      const newLocationData: LocationData = {};

      if (!locationEdited) {
        // User didn't edit - use detected location data if available
        if (detectedLocationData) {
          if (detectedLocationData.city)
            newLocationData.city = detectedLocationData.city;
          if (detectedLocationData.state)
            newLocationData.state = detectedLocationData.state;
          if (detectedLocationData.lat !== undefined)
            newLocationData.lat = detectedLocationData.lat;
          if (detectedLocationData.lon !== undefined)
            newLocationData.lon = detectedLocationData.lon;
        }
      } else {
        // User edited - use current field values and coordinates from autocomplete
        if (city.trim()) newLocationData.city = city.trim();
        if (state.trim()) newLocationData.state = state.trim();
        // Use coordinates from autocomplete selection if available
        if (selectedLocationCoords) {
          if (selectedLocationCoords.lat !== undefined)
            newLocationData.lat = selectedLocationCoords.lat;
          if (selectedLocationCoords.lon !== undefined)
            newLocationData.lon = selectedLocationCoords.lon;
        }
      }

      onLocationDataChange(newLocationData);
    };

    updateLocationData();
  }, [
    city,
    state,
    locationEdited,
    detectedLocationData,
    selectedLocationCoords,
    onLocationDataChange,
  ]);

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

    // Clear city when state changes manually since we can't verify if city is in new state
    if (city) {
      setCity('');
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setSelectedLocationCoords(null);
    }

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

    // Extract and update state from the selected city
    const stateName = extractState(result);
    if (stateName) {
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

    // Clear city when state changes via selection since we can't verify if city is in new state
    if (city) {
      setCity('');
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setSelectedLocationCoords(null);
    }
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
        onCountryChange(item);
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
    <>
      <Text style={[styles.label, { color: colors.text }]}>Country *</Text>
      <TouchableOpacity
        style={[styles.input, styles.pickerButton, pickerButtonStyle]}
        onPress={() => setShowCountryPicker(true)}
        disabled={disabled || isLoadingCountries}
      >
        {isLoadingCountries ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : selectedCountry ? (
          <Text style={[styles.pickerText, { color: colors.text }]}>
            {selectedCountry.name}
          </Text>
        ) : (
          <Text style={[styles.pickerText, { color: colors.textSecondary }]}>
            Select your country
          </Text>
        )}
        <Text style={[styles.pickerArrow, { color: colors.textSecondary }]}>
          ▼
        </Text>
      </TouchableOpacity>

      {/* Optional Location Fields */}
      <View
        style={[styles.optionalSection, { borderTopColor: colors.inputBorder }]}
      >
        <Text style={[styles.label, { color: colors.text }]}>
          City
          {locationDetected && city && !locationEdited && (
            <Text style={[styles.autoDetected, { color: colors.primary }]}>
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
                citySuggestions.length > 0 &&
                styles.inputWithSuggestions,
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
            editable={!disabled && !!selectedCountry}
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
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.suggestionItem,
                    { borderBottomColor: colors.inputBorder },
                  ]}
                  onPress={() => handleCitySelect(item)}
                >
                  <Text style={[styles.suggestionText, { color: colors.text }]}>
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
            <Text style={[styles.autoDetected, { color: colors.primary }]}>
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
                stateSuggestions.length > 0 &&
                styles.inputWithSuggestions,
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
              if (state.trim().length >= 2 && stateSuggestions.length > 0) {
                setShowStateSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow selection
              setTimeout(() => setShowStateSuggestions(false), 200);
            }}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!disabled && !!selectedCountry}
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
                  <Text style={[styles.suggestionText, { color: colors.text }]}>
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
    </>
  );
}

const styles = StyleSheet.create({
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
  inputWithSuggestions: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  optionalSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
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
