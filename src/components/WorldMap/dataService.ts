/**
 * Data fetching service for WorldMap component
 */

import { principlesApi } from '../../api/principles';
import type { CountryPercentage, MapStateInfo } from './types';

/**
 * Fetch country agreement percentages from the API
 * @param principleIds - Array of principle IDs (optional)
 * @param userId - User ID (optional)
 * @param mapState - Current map state (zoom, center, bounds) - used for detail level
 * @param signal - AbortSignal for cancelling the request
 */
export async function fetchCountryAgreementPercentages(
  principleIds?: string[],
  userId?: string,
  mapState?: MapStateInfo,
  signal?: AbortSignal,
): Promise<Map<string, number>> {
  // If no principleIds and no userId, return empty map
  if ((!principleIds || principleIds.length === 0) && !userId) {
    return new Map();
  }

  try {
    if (principleIds && principleIds.length > 0) {
      console.log('Fetching analytics with principle IDs:', principleIds);
    } else if (userId) {
      console.log('Fetching analytics with userId:', userId);
    }

    if (mapState) {
      console.log('Map state:', {
        zoom: mapState.zoom,
        center: mapState.center,
        bounds: mapState.bounds,
      });
    }

    const result = await principlesApi.getCountryAgreementPercentages(
      principleIds,
      userId,
      mapState,
      signal,
    );

    if (result.status === 'success' && result.data) {
      console.log('Country Agreement Percentages:', result.data);

      // Create a map of country code -> percentage
      const percentageMap = new Map<string, number>();
      result.data.countries.forEach((item: CountryPercentage) => {
        percentageMap.set(item.country.code, item.percentage);
      });

      return percentageMap;
    } else {
      console.log('Error fetching analytics:', result.message);
      return new Map();
    }
  } catch (error: any) {
    // Don't log AbortError as it's expected when cancelling requests
    if (error?.name !== 'AbortError') {
      console.log('Error in analytics fetch:', error);
    }
    return new Map();
  }
}
