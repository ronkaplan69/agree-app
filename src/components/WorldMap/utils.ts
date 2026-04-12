/**
 * Utility functions for WorldMap component
 */

/**
 * Convert percentage (0-100) to a color on a scale from gray (0%) to green (100%)
 */
export function percentageToColor(percentage: number): string {
  if (percentage === 0 || isNaN(percentage)) {
    return '#C8C8C8'; // Light gray for no data or 0%
  }

  // Color scale: light gray (0%) -> hard saturated green (100%)
  // Interpolate between gray RGB and green RGB
  const grayR = 200; // #C8C8C8
  const grayG = 200;
  const grayB = 200;

  const greenR = 5; // #00CC00 - hard saturated green
  const greenG = 20;
  const greenB = 230;

  // Interpolate based on percentage (0-100)
  const t = percentage / 100;
  const r = Math.round(grayR + (greenR - grayR) * t);
  const g = Math.round(grayG + (greenG - grayG) * t);
  const b = Math.round(grayB + (greenB - grayB) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Build color expression for countries based on percentage data
 * Returns a Mapbox case expression for styling countries by their agreement percentage
 */
export function buildColorExpression(
  countryPercentages: Map<string, number>,
): string | any[] {
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
}

/**
 * Create minimal map style - countries only, no labels or state lines
 */
export function createMinimalMapStyle(
  backgroundColor: string,
  countryPercentages: Map<string, number>,
): object {
  return {
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
          'fill-color': buildColorExpression(countryPercentages),
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
}
