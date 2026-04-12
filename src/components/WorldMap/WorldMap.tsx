/**
 * WorldMap Component
 * Displays a world map with country-level data visualization
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Text } from 'react-native';
import Mapbox, { MapView, Camera, type MapState } from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';
import { fetchCountryAgreementPercentages } from './dataService';
import { createMinimalMapStyle } from './utils';
import { createCameraChangedHandler, createMapIdleHandler } from './handlers';
import type { WorldMapProps, MapStateInfo } from './types';

// Initialize Mapbox with access token
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export function WorldMap({
  highlightColor: _highlightColor = '#2e9b5f',
  backgroundColor = '#0f1f15',
  principleIds,
  userId,
  onZoom,
  onMove,
  onCameraChange,
  onMapIdle,
}: WorldMapProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const mapHeight = isLandscape ? height * 0.5 : width * 0.65;

  // Store country percentage data
  const [countryPercentages, setCountryPercentages] = useState<
    Map<string, number>
  >(new Map());

  // Ref to track and cancel previous API requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track current zoom level for zoom controls
  const [currentZoom, setCurrentZoom] = useState(1);
  const cameraRef = useRef<React.ComponentRef<typeof Camera>>(null);

  // Fetch analytics data function (memoized to avoid recreating on every render)
  const fetchAnalytics = useCallback(
    async (mapState?: MapStateInfo) => {
      // Cancel any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      const percentageMap = await fetchCountryAgreementPercentages(
        principleIds,
        userId,
        mapState,
        abortControllerRef.current.signal,
      );

      // Only update state if request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setCountryPercentages(percentageMap);
      }
    },
    [principleIds, userId],
  );

  // Default initial map state (matches Camera initial props)
  const defaultMapState: MapStateInfo = {
    zoom: 1,
    center: [0, 20], // [lng, lat]
    bounds: {
      ne: [180, 85], // Approximate world bounds
      sw: [-180, -85],
    },
  };

  // Fetch analytics data on initial load and when principleIds or userId changes
  useEffect(() => {
    fetchAnalytics(defaultMapState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [principleIds, userId]);

  // Cleanup: Cancel any pending requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Zoom control handlers
  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + 1, 20); // Max zoom 20
    setCurrentZoom(newZoom);
    cameraRef.current?.zoomTo(newZoom, 200);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - 1, 0); // Min zoom 0
    setCurrentZoom(newZoom);
    cameraRef.current?.zoomTo(newZoom, 200);
  };

  // Create event handlers
  const handleCameraChanged = (state: MapState) => {
    // Update current zoom level
    setCurrentZoom(state.properties.zoom);
    
    // Call the original handler
    const handler = createCameraChangedHandler(
      onCameraChange,
      onZoom,
      onMove,
    );
    handler(state);
  };

  // Enhanced map idle handler that also fetches data
  const handleMapIdle = (state: MapState) => {
    const { zoom, center, bounds } = state.properties;

    // Extract map state info
    const mapStateInfo: MapStateInfo = {
      zoom,
      center: [center[0], center[1]] as [number, number],
      bounds: {
        ne: [bounds.ne[0], bounds.ne[1]] as [number, number],
        sw: [bounds.sw[0], bounds.sw[1]] as [number, number],
      },
    };

    // Fetch data for the current map view
    fetchAnalytics(mapStateInfo);

    // Call the user-provided onMapIdle callback if provided
    const baseHandler = createMapIdleHandler(onMapIdle, abortControllerRef);
    baseHandler(state);
  };

  // Create map style
  const minimalStyle = createMinimalMapStyle(backgroundColor, countryPercentages);

  return (
    <View style={[styles.container, { height: mapHeight }]}>
      <MapView
        style={styles.map}
        styleJSON={JSON.stringify(minimalStyle)}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
        onCameraChanged={handleCameraChanged}
        onMapIdle={handleMapIdle}
      >
        <Camera
          ref={cameraRef}
          zoomLevel={1}
          centerCoordinate={[0, 20]}
          animationMode="none"
        />
      </MapView>
      
      {/* Temporary zoom controls for simulator */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={handleZoomIn}
          activeOpacity={0.7}
        >
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={handleZoomOut}
          activeOpacity={0.7}
        >
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
      </View>
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
  zoomControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#333',
  },
});
