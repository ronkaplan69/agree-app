import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { principlesApi, Principle } from '../api';

const PREVIEW_LENGTH = 80; // Characters to show in preview

export function PrinciplesScreen() {
  const isDarkMode = useColorScheme() === 'dark';

  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [filteredPrinciples, setFilteredPrinciples] = useState<Principle[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const colors = {
    background: isDarkMode ? '#0f1f15' : '#f4f9f6',
    card: isDarkMode ? '#152b1c' : '#ffffff',
    cardAgreed: isDarkMode ? '#1a3d24' : '#e6f5eb',
    text: isDarkMode ? '#e8f0eb' : '#1a2e20',
    textSecondary: isDarkMode ? '#8fa898' : '#5c7365',
    inputBg: isDarkMode ? '#152b1c' : '#ffffff',
    inputBorder: isDarkMode ? '#2d4a38' : '#d4e5db',
    primary: '#2e9b5f',
    border: isDarkMode ? '#2d4a38' : '#d4e5db',
  };

  const loadPrinciples = useCallback(async () => {
    try {
      const result = await principlesApi.getAll(1, 100);
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

  // Filter principles when search text changes
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

  const handleToggleAgreement = async (principle: Principle) => {
    if (principle.userAgreed) {
      await removeAgreement(principle._id);
    } else {
      await agree(principle._id);
    }
  };

  const agree = async (id: string) => {
    const result = await principlesApi.agree(id);
    if (result.status === 'success' && result.data) {
      // Update local state
      setPrinciples(prev =>
        prev.map(p =>
          p._id === id
            ? {
                ...p,
                agreementCount: result.data!.agreementCount,
                userAgreed: true,
              }
            : p,
        ),
      );
    } else {
      Alert.alert('Error', result.message || 'Failed to agree');
    }
  };

  const removeAgreement = async (id: string) => {
    const result = await principlesApi.removeAgreement(id);
    if (result.status === 'success' && result.data) {
      // Update local state
      setPrinciples(prev =>
        prev.map(p =>
          p._id === id
            ? {
                ...p,
                agreementCount: result.data!.agreementCount,
                userAgreed: false,
              }
            : p,
        ),
      );
    } else {
      Alert.alert('Error', result.message || 'Failed to remove agreement');
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
      // Add to list and clear search
      setPrinciples(prev => [result.data!.principle, ...prev]);
      setSearchText('');
      Alert.alert(
        'Success',
        'Principle created and you automatically agree with it!',
      );
    } else {
      Alert.alert('Error', result.message || 'Failed to create principle');
    }
  };

  const isTextTruncated = (text: string) => text.length > PREVIEW_LENGTH;

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderPrinciple = ({ item }: { item: Principle }) => {
    const isTruncated = isTextTruncated(item.text);
    const isExpanded = expandedIds.has(item._id);
    const displayText =
      isTruncated && !isExpanded
        ? item.text.substring(0, PREVIEW_LENGTH) + '...'
        : item.text;

    // Can only agree if text is fully visible (not truncated or expanded)
    // Can always disagree (remove agreement) even if collapsed
    const canAgree = !isTruncated || isExpanded || item.userAgreed;

    return (
      <View
        style={[
          styles.principleCard,
          {
            backgroundColor: item.userAgreed ? colors.cardAgreed : colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {isTruncated ? (
          <TouchableOpacity
            onPress={() => toggleExpanded(item._id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.principleText, { color: colors.text }]}>
              {displayText}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.principleText, { color: colors.text }]}>
            {displayText}
          </Text>
        )}
        <View style={styles.principleFooter}>
          <Text
            style={[styles.agreementCount, { color: colors.textSecondary }]}
          >
            {item.agreementCount}{' '}
            {item.agreementCount === 1 ? 'person agrees' : 'people agree'}
          </Text>
          <TouchableOpacity
            style={[
              styles.agreeButton,
              {
                backgroundColor: item.userAgreed
                  ? colors.primary
                  : 'transparent',
                borderColor: item.userAgreed
                  ? colors.primary
                  : canAgree
                  ? '#5cb885'
                  : colors.border,
                opacity: canAgree ? 1 : 0.35,
              },
            ]}
            onPress={() => handleToggleAgreement(item)}
            activeOpacity={0.7}
            disabled={!canAgree}
          >
            <Text
              style={[
                styles.agreeButtonIcon,
                { color: item.userAgreed ? '#fff' : colors.textSecondary },
              ]}
            >
              ✓
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
      {/* Search/Add Box */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
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
              color: searchText.length > 300 ? '#ef4444' : colors.textSecondary,
            },
          ]}
        >
          {searchText.length}/300
        </Text>
      )}

      {/* Hint */}
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Tap the button to agree or remove agreement
      </Text>

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
                ? 'No principles match your search.\nBe the first to add this one!'
                : 'No principles yet.\nBe the first to add one!'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agreementCount: {
    fontSize: 13,
  },
  agreeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreeButtonIcon: {
    fontSize: 16,
    fontWeight: '700',
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
