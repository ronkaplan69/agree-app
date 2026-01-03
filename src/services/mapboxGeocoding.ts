import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox';

export type GeocodingResult = {
  id: string;
  text: string; // Display name
  place_name: string; // Full address
  center: [number, number]; // [lon, lat]
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  properties?: {
    accuracy?: string;
  };
};

type GeocodingResponse = {
  type: string;
  query: string[];
  features: GeocodingResult[];
  attribution: string;
};

/**
 * Search for places using Mapbox Geocoding API
 * @param query - Search query (e.g., "New York" or "Paris")
 * @param countryCode - Optional ISO country code to restrict results (e.g., "US", "FR")
 * @param types - Optional array of place types to filter (e.g., ["place", "region"])
 * @param limit - Maximum number of results (default: 5)
 */
export async function searchPlaces(
  query: string,
  countryCode?: string,
  types?: string[],
  limit: number = 5,
): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
    const encodedQuery = encodeURIComponent(query.trim());

    // Build URL with parameters
    let url = `${baseUrl}/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=${limit}`;

    // Restrict to country if provided
    if (countryCode) {
      url += `&country=${countryCode.toUpperCase()}`;
    }

    // Filter by place types if provided
    if (types && types.length > 0) {
      url += `&types=${types.join(',')}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.log(
        'Mapbox Geocoding error:',
        response.status,
        response.statusText,
      );
      return [];
    }

    const data: GeocodingResponse = await response.json();
    return data.features || [];
  } catch (error) {
    console.log('Mapbox Geocoding error:', error);
    return [];
  }
}

/**
 * Extract city name from geocoding result
 */
export function extractCity(result: GeocodingResult): string | null {
  // Look for "place" in context (city/town)
  const placeContext = result.context?.find(ctx => ctx.id.startsWith('place.'));
  if (placeContext) {
    return placeContext.text;
  }

  // Fallback: if result type is "place", use the main text
  if (result.properties?.accuracy === 'place') {
    return result.text;
  }

  return null;
}

/**
 * Extract state/region name from geocoding result
 */
export function extractState(result: GeocodingResult): string | null {
  // Look for "region" in context (state/province)
  const regionContext = result.context?.find(ctx =>
    ctx.id.startsWith('region.'),
  );
  if (regionContext) {
    return regionContext.text;
  }

  // Also check for "district" (some countries use this)
  const districtContext = result.context?.find(ctx =>
    ctx.id.startsWith('district.'),
  );
  if (districtContext) {
    return districtContext.text;
  }

  return null;
}

/**
 * Search for cities in a specific country
 */
export async function searchCities(
  query: string,
  countryCode: string,
  limit: number = 5,
): Promise<GeocodingResult[]> {
  return searchPlaces(query, countryCode, ['place'], limit);
}

/**
 * Search for states/regions in a specific country
 */
export async function searchStates(
  query: string,
  countryCode: string,
  limit: number = 5,
): Promise<GeocodingResult[]> {
  return searchPlaces(query, countryCode, ['region'], limit);
}
