import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Principle } from '../api';
import { useColors } from '../theme/colors';
import { BatteryIndicator } from './BatteryIndicator';

interface PrincipleCardProps {
  principle: Principle;
  onPress: (principle: Principle) => void;
  variant?: 'default' | 'highlighted';
}

export function PrincipleCard({
  principle,
  onPress,
  variant,
}: PrincipleCardProps) {
  const colors = useColors();

  // Determine card background color
  const cardBackgroundColor =
    variant === 'highlighted' || principle.userAgreed
      ? colors.cardHighlight
      : colors.card;

  return (
    <TouchableOpacity
      style={[
        styles.principleCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: colors.border,
        },
      ]}
      onPress={() => onPress(principle)}
      activeOpacity={0.7}
    >
      <Text style={[styles.principleText, { color: colors.text }]}>
        {principle.text}
      </Text>
      <View style={styles.principleFooter}>
        <View style={styles.agreementRow}>
          <View style={styles.batteryContainer}>
            <BatteryIndicator strength={principle.strength} size="small" />
          </View>
          <Text
            style={[styles.agreementCount, { color: colors.textSecondary }]}
          >
            {' ('}
            {principle.agreementCount}
            {') '}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreementCount: {
    fontSize: 13,
  },
  batteryContainer: {
    marginLeft: 8,
  },
});
