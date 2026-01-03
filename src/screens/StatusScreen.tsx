import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useColors } from '../theme/colors';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Status'>;
};

export function StatusScreen({ navigation: _navigation }: Props) {
  const colors = useColors();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    'Principles and Values': true,
    Maps: true,
    Profile: true,
  });

  const statusPoints = {
    'Principles and Values': [
      'Search will be smart and will try to find similar principles and avoid duplicates.',
      'There will be a suggestion mechanism to help find similar principles. "we think you might like this"',
      "Principles cannot mention countries or specific people. Goal is to keep it global and that a truth will be true anywhere. It's a challenge how to frame that and still keep ideas as free as possible.",
      "It's challenge to encourage users to use practical ideas and less abstract ones.",
      'Principles (and manifests later) should align with what CAN be done and not by what IS today. For example you cannot use teleportation as part of your manifest but you can assume a world without countries.',
      'There will be some principles approval process to ensure they aligned with the app guidelines. it will be auto or human. pre or post publish (i.e user reports).',
      'The term "Principle" should be reconsidered',
      'There will be some kind of edit logic where agreeing users can suggest edits and some algorithm to decide if enough users agree to accept the edit. This is a UI/UX challenge to make it easy to see and use and understand.',
    ],
    Maps: [
      'Map will open to the user region',
      'Map should have a full screen mode.',
      'Map will show a different details level by zoom. Start by color to represent agreement strengh, then as you zoom in show the number and percentage, then specific users and their agreement strength with the principle or principles selected.',
    ],
    Profile: [
      'Country and nickname are required',
      'Add an optional profile picture',
      'App will encourage users to set a more precise location so it will show much better on maps. This can be done automatically on registration and in profile. TBD most auto and least denamding way to do this.',
    ],
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

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

        <View style={styles.sectionsContainer}>
          {Object.entries(statusPoints).map(([sectionTitle, points]) => {
            const isExpanded = expandedSections[sectionTitle];

            return (
              <View
                key={sectionTitle}
                style={[
                  styles.section,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(sectionTitle)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {sectionTitle}
                  </Text>
                  <Text style={[styles.chevron, { color: colors.text }]}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.pointsContainer}>
                    {points.map((point, index) => (
                      <View key={index} style={styles.pointItem}>
                        <View style={styles.bullet} />
                        <Text
                          style={[styles.pointText, { color: colors.text }]}
                        >
                          {point}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
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
  sectionsContainer: {
    gap: 16,
  },
  section: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  chevron: {
    fontSize: 14,
    marginLeft: 12,
  },
  pointsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
