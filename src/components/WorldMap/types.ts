/**
 * Types and interfaces for WorldMap component
 */

export interface CountryData {
  countryCode: string;
  count: number;
}

export interface CountryPercentage {
  country: {
    _id: string;
    name: string;
    code: string;
  };
  percentage: number; // Average percentage of principles that users in this country agree with
}

export interface MapBounds {
  ne: [number, number]; // northeast corner [lng, lat]
  sw: [number, number]; // southwest corner [lng, lat]
}

export interface MapStateInfo {
  zoom: number;
  center: [number, number]; // [lng, lat]
  bounds: MapBounds;
}

export interface WorldMapProps {
  highlightColor?: string;
  baseColor?: string;
  backgroundColor?: string;
  highlightedCountries?: CountryData[];
  principleIds?: string[];
  userId?: string;
  onZoom?: (zoomLevel: number) => void;
  onMove?: (centerCoordinate: [number, number]) => void;
  onCameraChange?: (
    zoomLevel: number,
    centerCoordinate: [number, number],
    isGestureActive: boolean,
  ) => void;
  onMapIdle?: (
    zoomLevel: number,
    centerCoordinate: [number, number],
    bounds: MapBounds,
  ) => void;
}
