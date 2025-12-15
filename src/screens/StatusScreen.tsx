import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useColors } from '../theme/colors';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Status'>;
};

export function StatusScreen({ navigation: _navigation }: Props) {
  const colors = useColors();

  const statusPoints = [
    'Search will be smart and will try to find similar principles and avoid duplicates.',
    'There will be a suggestion mechanism to help find similar principles. "we think you might like this"',
    'Exploring principles should be playful and fun. not just a list. Maybe Tinder style so users can swipe left or right to agree or disagree and will not see same principles again.',
    "Principles cannot mention countries or specific people. Goal is to keep it global and that a true will be true anywhere. It's a challenge how to frame that and still keep it free as possible. It's also a challenge to encourage users to use practical ideas and less abstract ones.",
    'Principles (and manifests later) should align with science but not with the current state of the world. For example you cannot use teleportation as part of your manifest but you can assume a world without countries or without capitalism.',
    'Map will open to the user region',
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Status & TBD
          </Text>
        </View>

        <View style={styles.pointsContainer}>
          {statusPoints.map((point, index) => (
            <View
              key={index}
              style={[
                styles.pointItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.bullet} />
              <Text style={[styles.pointText, { color: colors.text }]}>
                {point}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  pointsContainer: {
    gap: 12,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2e9b5f',
    marginTop: 8,
    marginRight: 12,
  },
  pointText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});
