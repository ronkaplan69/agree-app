import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { principlesApi, Principle } from '../api';
import { useColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import { SwipeablePrincipleCard } from '../components/SwipeablePrincipleCard';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Principles'
>;

const DEBOUNCE_DELAY = 500; // milliseconds

export function PrinciplesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useColors();

  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPrinciples = useCallback(async (search?: string) => {
    try {
      setIsLoading(true);
      console.log('Loading principles with search:', search);
      const result = await principlesApi.getAll(1, 100, search);
      if (result.status === 'success' && result.data) {
        setPrinciples(result.data.principles);
        console.log('Principles:', result.data.principles);
      }
    } catch (error) {
      console.log('Failed to load principles:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const isInitialMount = useRef(true);

  // Initial load
  useEffect(() => {
    loadPrinciples();
    isInitialMount.current = false;
  }, [loadPrinciples]);

  // Debounced search effect
  useEffect(() => {
    // Skip debounce on initial mount (handled by initial load effect)
    if (isInitialMount.current) {
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set up debounce timer - only set loading when API call actually happens
    debounceTimerRef.current = setTimeout(() => {
      const searchQuery = searchText.trim() || undefined;
      console.log('Debounced search triggered with query:', searchQuery);
      loadPrinciples(searchQuery);
    }, DEBOUNCE_DELAY);

    // Cleanup on unmount or when searchText changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [searchText, loadPrinciples]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const searchQuery = searchText.trim() || undefined;
    loadPrinciples(searchQuery);
  };

  const handleSwipeRight = async (principle: Principle) => {
    // Swipe right = agree
    const result = await principlesApi.agree(principle._id);
    if (result.status === 'success') {
      // Remove from list since user has now interacted with it
      setPrinciples(prev => prev.filter(p => p._id !== principle._id));
    } else {
      Alert.alert('Error', result.message || 'Failed to agree');
    }
  };

  const handleSwipeLeft = async (principle: Principle) => {
    // Swipe left = disagree
    const result = await principlesApi.disagree(principle._id);
    if (result.status === 'success') {
      // Remove from list since user has now interacted with it
      setPrinciples(prev => prev.filter(p => p._id !== principle._id));
    } else {
      Alert.alert('Error', result.message || 'Failed to disagree');
    }
  };

  const handleAddPrinciple = async () => {
    const text = searchText.trim();
    if (!text) {
      Alert.alert('Error', 'Please enter a principle text');
      return;
    }

    if (text.length > 300) {
      Alert.alert('Error', 'Principle text cannot exceed 300 characters');
      return;
    }

    setIsAdding(true);
    const result = await principlesApi.create(text);
    setIsAdding(false);

    if (result.status === 'success' && result.data) {
      // Clear search and reload principles to get fresh data from server
      setSearchText('');
      await loadPrinciples();
      Alert.alert(
        'Success',
        'Principle created and you automatically agree with it!',
      );
    } else {
      Alert.alert('Error', result.message || 'Failed to create principle');
    }
  };

  const handleNavigateToDetails = (principle: Principle) => {
    navigation.navigate('PrincipleDetail', { principle });
  };

  const renderPrinciple = ({ item }: { item: Principle }) => {
    return (
      <SwipeablePrincipleCard
        principle={item}
        onPress={handleNavigateToDetails}
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search/Add Box */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Search or add a principle..."
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: colors.primary },
            isAdding && styles.buttonDisabled,
          ]}
          onPress={handleAddPrinciple}
          disabled={isAdding || !searchText.trim()}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Character count */}
      {searchText.length > 0 && (
        <Text
          style={[
            styles.charCount,
            {
              color:
                searchText.length > 300 ? colors.error : colors.textSecondary,
            },
          ]}
        >
          {searchText.length}/300
        </Text>
      )}

      {/* Principles List */}
      <FlatList
        data={principles}
        keyExtractor={item => item._id}
        renderItem={renderPrinciple}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          isLoading && !isRefreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchText.trim()
                  ? 'No principles match your search.\nBe the first to add this one!'
                  : 'No principles yet.\nBe the first to add one!'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    paddingHorizontal: 16,
    marginTop: -8,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
