import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useColors } from '../theme/colors';
import { principlesApi } from '../api';
import { WorldMap } from '../components/WorldMap';

type Props = NativeStackScreenProps<RootStackParamList, 'PrincipleDetail'>;

export function PrincipleDetailScreen({ route }: Props) {
  const colors = useColors();
  const { principle: initialPrinciple } = route.params;

  const [userAgreed, setUserAgreed] = useState(initialPrinciple.userAgreed);
  const [agreementCount, setAgreementCount] = useState(
    initialPrinciple.agreementCount,
  );

  const handleToggleAgreement = async () => {
    if (userAgreed) {
      const result = await principlesApi.removeAgreement(initialPrinciple._id);
      if (result.status === 'success' && result.data) {
        setUserAgreed(false);
        setAgreementCount(result.data.agreementCount);
      } else {
        Alert.alert('Error', result.message || 'Failed to remove agreement');
      }
    } else {
      const result = await principlesApi.agree(initialPrinciple._id);
      if (result.status === 'success' && result.data) {
        setUserAgreed(true);
        setAgreementCount(result.data.agreementCount);
      } else {
        Alert.alert('Error', result.message || 'Failed to agree');
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* World Map - Main Element */}
      <View
        style={[
          styles.mapCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <WorldMap
          highlightColor={colors.primary}
          baseColor={colors.isDarkMode ? '#1a3d24' : '#c8e6d0'}
          principleIds={[initialPrinciple._id]}
        />
        <Text style={[styles.mapLabel, { color: colors.textSecondary }]}>
          {agreementCount} {agreementCount === 1 ? 'person' : 'people'} agree
          worldwide
        </Text>
      </View>

      {/* Principle Text */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.principleText, { color: colors.text }]}>
          {initialPrinciple.text}
        </Text>
      </View>

      {/* Agree Button */}
      <TouchableOpacity
        style={[
          styles.agreeButton,
          {
            backgroundColor: userAgreed ? colors.primary : 'transparent',
            borderColor: userAgreed ? colors.primary : colors.primaryLight,
          },
        ]}
        onPress={handleToggleAgreement}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.agreeButtonText,
            { color: userAgreed ? colors.white : colors.primary },
          ]}
        >
          {userAgreed ? '✓ You agree' : 'Agree'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  mapCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  mapLabel: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  principleText: {
    fontSize: 18,
    lineHeight: 26,
  },
  agreeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  agreeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
