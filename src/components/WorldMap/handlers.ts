/**
 * Event handlers for WorldMap component
 */

import type { MutableRefObject } from 'react';
import type { MapState } from '@rnmapbox/maps';
import type { WorldMapProps, MapBounds } from './types';

/**
 * Extract center coordinate from MapState
 */
function extractCenterCoordinate(
  center: GeoJSON.Position,
): [number, number] {
  return [center[0], center[1]];
}

/**
 * Extract bounds from MapState
 */
function extractBounds(state: MapState): MapBounds {
  const { bounds } = state.properties;
  return {
    ne: [bounds.ne[0], bounds.ne[1]] as [number, number], // northeast [lng, lat]
    sw: [bounds.sw[0], bounds.sw[1]] as [number, number], // southwest [lng, lat]
  };
}

/**
 * Handle camera changes (zoom and drag events)
 */
export function createCameraChangedHandler(
  onCameraChange?: WorldMapProps['onCameraChange'],
  onZoom?: WorldMapProps['onZoom'],
  onMove?: WorldMapProps['onMove'],
) {
  return (state: MapState) => {
    const { zoom, center } = state.properties;
    const { isGestureActive } = state.gestures;

    // Extract longitude and latitude from GeoJSON.Position
    const centerCoordinate = extractCenterCoordinate(center);

    // Call the general camera change handler
    if (onCameraChange) {
      onCameraChange(zoom, centerCoordinate, isGestureActive);
    }

    // Call specific zoom handler
    if (onZoom) {
      onZoom(zoom);
    }

    // Call specific move handler
    if (onMove) {
      onMove(centerCoordinate);
    }
  };
}

/**
 * Handle map idle (when zoom/drag stops)
 * This is the best place to call server functions to fetch data for the visible region
 */
export function createMapIdleHandler(
  onMapIdle?: WorldMapProps['onMapIdle'],
  abortControllerRef?: MutableRefObject<AbortController | null>,
) {
  return (state: MapState) => {
    const { zoom, center } = state.properties;

    // Extract longitude and latitude from GeoJSON.Position
    const centerCoordinate = extractCenterCoordinate(center);
    const boundsData = extractBounds(state);

    // Cancel any previous in-flight request
    if (abortControllerRef?.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    if (abortControllerRef) {
      abortControllerRef.current = new AbortController();
    }

    // Call the onMapIdle callback with all relevant data
    if (onMapIdle) {
      onMapIdle(zoom, centerCoordinate, boundsData);
    }

    // Example: Fetch data for visible region
    // You can add your server call here, for example:
    // fetchDataForVisibleRegion(boundsData, zoom, abortControllerRef.current.signal);
  };
}
