import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { principlesApi, Principle } from '../api';
import { useColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import { WorldMap } from '../components/WorldMap';
import { useAuth } from '../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MyPrinciples'
>;

export function MyPrinciplesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useColors();
  const { user } = useAuth();

  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [filteredPrinciples, setFilteredPrinciples] = useState<Principle[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPrinciples = useCallback(async () => {
    try {
      const result = await principlesApi.getMyAgreed(1, 100);
      if (result.status === 'success' && result.data) {
        setPrinciples(result.data.principles);
        setFilteredPrinciples(result.data.principles);
      }
    } catch (error) {
      console.log('Failed to load principles:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPrinciples();
  }, [loadPrinciples]);

  // Filter principles when search text changes (client-side filtering for now)
  // TODO: Could be moved to server-side by passing search param to getMyAgreed
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredPrinciples(principles);
    } else {
      const query = searchText.toLowerCase();
      const filtered = principles.filter(p =>
        p.text.toLowerCase().includes(query),
      );
      setFilteredPrinciples(filtered);
    }
  }, [searchText, principles]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPrinciples();
  };

  const handleNavigateToDetails = (principle: Principle) => {
    navigation.navigate('PrincipleDetail', { principle });
  };

  const renderPrinciple = ({ item }: { item: Principle }) => {
    return (
      <TouchableOpacity
        style={[
          styles.principleCard,
          {
            backgroundColor: colors.cardHighlight,
            borderColor: colors.border,
          },
        ]}
        onPress={() => handleNavigateToDetails(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.principleText, { color: colors.text }]}>
          {item.text}
        </Text>
        <View style={styles.principleFooter}>
          <Text
            style={[styles.agreementCount, { color: colors.textSecondary }]}
          >
            {item.agreementCount}{' '}
            {item.agreementCount === 1 ? 'person agrees' : 'people agree'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* World Map */}
      <View style={styles.mapContainer}>
        <WorldMap userId={user?.id} />
      </View>

      {/* Search Box */}
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
          placeholder="Search your principles..."
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          multiline
        />
      </View>

      {/* Principles List */}
      <FlatList
        data={filteredPrinciples}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchText
                ? 'No principles match your search.'
                : "You haven't agreed with any principles yet.\nGo to Principles to get started!"}
            </Text>
          </View>
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
  mapContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 8,
  },
  searchInput: {
    minHeight: 48,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  principleCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  principleText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  principleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreementCount: {
    fontSize: 13,
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
