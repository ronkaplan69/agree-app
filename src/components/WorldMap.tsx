import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Mapbox, { MapView, Camera } from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox';
import { principlesApi } from '../api/principles';

// Initialize Mapbox with access token
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

// Country ISO codes to highlight (will be populated with agreement data later)
interface CountryData {
  countryCode: string;
  count: number;
}

interface CountryPercentage {
  country: {
    _id: string;
    name: string;
    code: string;
  };
  // totalUsers: number;
  // usersWithAgreements: number; // Users who agree with at least one principle
  percentage: number; // Average percentage of principles that users in this country agree with
}

interface WorldMapProps {
  highlightColor?: string;
  baseColor?: string;
  backgroundColor?: string;
  highlightedCountries?: CountryData[];
  principleIds?: string[];
  userId?: string;
}

// Convert percentage (0-100) to a color on a scale from gray (0%) to green (100%)
function percentageToColor(percentage: number): string {
  if (percentage === 0 || isNaN(percentage)) {
    return '#C8C8C8'; // Light gray for no data or 0%
  }

  // Color scale: light gray (0%) -> hard saturated green (100%)
  // Interpolate between gray RGB and green RGB
  const grayR = 200; // #C8C8C8
  const grayG = 200;
  const grayB = 200;

  const greenR = 0; // #00CC00 - hard saturated green
  const greenG = 204;
  const greenB = 0;

  // Interpolate based on percentage (0-100)
  const t = percentage / 100;
  const r = Math.round(grayR + (greenR - grayR) * t);
  const g = Math.round(grayG + (greenG - grayG) * t);
  const b = Math.round(grayB + (greenB - grayB) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

export function WorldMap({
  highlightColor: _highlightColor = '#2e9b5f',
  backgroundColor = '#0f1f15',
  principleIds,
  userId,
}: WorldMapProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const mapHeight = isLandscape ? height * 0.5 : width * 0.65;

  // Store country percentage data
  const [countryPercentages, setCountryPercentages] = useState<
    Map<string, number>
  >(new Map());

  // Call analytics endpoint with principle IDs or userId from parent
  useEffect(() => {
    const fetchAnalytics = async () => {
      // If no principleIds and no userId, clear the map
      if ((!principleIds || principleIds.length === 0) && !userId) {
        setCountryPercentages(new Map());
        return;
      }

      try {
        if (principleIds && principleIds.length > 0) {
          console.log('Fetching analytics with principle IDs:', principleIds);
        } else if (userId) {
          console.log('Fetching analytics with userId:', userId);
        }

        const result = await principlesApi.getCountryAgreementPercentages(
          principleIds,
          userId,
        );

        if (result.status === 'success' && result.data) {
          console.log('Country Agreement Percentages:', result.data);

          // Create a map of country code -> percentage
          const percentageMap = new Map<string, number>();
          result.data.countries.forEach((item: CountryPercentage) => {
            percentageMap.set(item.country.code, item.percentage);
          });

          setCountryPercentages(percentageMap);
        } else {
          console.log('Error fetching analytics:', result.message);
          setCountryPercentages(new Map());
        }
      } catch (error) {
        console.log('Error in analytics fetch:', error);
        setCountryPercentages(new Map());
      }
    };

    fetchAnalytics();
  }, [principleIds, userId]);

  // Build color expression for countries based on percentage data
  const buildColorExpression = (): string | any[] => {
    if (countryPercentages.size === 0) {
      // No data: return default light gray
      return '#C8C8C8';
    }

    // Build a case expression: check each country code and return its color
    // Format: ['case', condition1, color1, condition2, color2, ..., defaultColor]
    const cases: any[] = ['case'];

    countryPercentages.forEach((percentage, countryCode) => {
      cases.push(['==', ['get', 'iso_3166_1'], countryCode]);
      cases.push(percentageToColor(percentage));
    });

    // Default color for countries not in the data (light gray)
    cases.push('#C8C8C8');

    return cases;
  };

  // Custom minimal style - countries only, no labels or state lines
  const minimalStyle = {
    version: 8,
    name: 'Minimal Countries',
    sources: {
      countries: {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': backgroundColor,
        },
      },
      {
        id: 'country-fill',
        type: 'fill',
        source: 'countries',
        'source-layer': 'country_boundaries',
        paint: {
          'fill-color': buildColorExpression(),
          'fill-opacity': 0.9,
        },
      },
      {
        id: 'country-borders',
        type: 'line',
        source: 'countries',
        'source-layer': 'country_boundaries',
        paint: {
          'line-color': '#2a2a2a',
          'line-width': 0.5,
          'line-opacity': 0.8,
        },
      },
    ],
  };

  return (
    <View style={[styles.container, { height: mapHeight }]}>
      <MapView
        style={styles.map}
        styleJSON={JSON.stringify(minimalStyle)}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        <Camera zoomLevel={1} centerCoordinate={[0, 20]} animationMode="none" />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
