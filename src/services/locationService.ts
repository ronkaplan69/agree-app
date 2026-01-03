/**
 * Location service for detecting user location from IP
 * Uses ipapi.co (free tier with HTTPS support)
 *
 * Note: For production, consider moving this to your backend
 * to avoid CORS issues and have better control over rate limiting
 *
 * TESTING WITH DIFFERENT IPs:
 * - Set TEST_IP below to use a fake IP for testing
 * - Set to null to use your actual IP
 * - Example IPs: '8.8.8.8' (US), '1.1.1.1' (AU), '208.67.222.222' (US)
 */

// Set this to a test IP address, or null to use your actual IP
const TEST_IP: string | null = '77.137.65.150'; // Change to '8.8.8.8' or another IP to test

export type LocationData = {
  country: string;
  countryCode: string;
  region: string; // State/Province
  regionName: string; // Full state/province name
  city: string;
  lat?: number;
  lon?: number;
  detected: boolean;
};

type IpApiResponse = {
  country_name?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  error?: boolean;
  reason?: string;
};

export const locationService = {
  /**
   * Detect location from IP address
   * Returns location data if successful, null otherwise
   * Uses TEST_IP if set, otherwise detects from user's actual IP
   */
  async detectFromIP(): Promise<LocationData | null> {
    // If TEST_IP is set, use it for testing
    if (TEST_IP) {
      return this.detectFromSpecificIP(TEST_IP);
    }

    try {
      // ipapi.co free tier: 1000 requests/day, HTTPS supported
      // No API key required for basic usage
      // TODO: For production, consider moving this to your backend to avoid potential CORS issues and have better control over rate limiting.
      const response = await fetch('https://ipapi.co/json/');

      if (!response.ok) {
        console.log(
          `Location detection failed: HTTP ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const data: IpApiResponse = await response.json();

      if (data.error || !data.country_code) {
        console.log(
          'Location detection failed:',
          data.reason || 'Unknown error',
        );
        return null;
      }

      return {
        country: data.country_name || '',
        countryCode: data.country_code || '',
        region: data.region_code || '',
        regionName: data.region || '',
        city: data.city || '',
        lat: data.latitude,
        lon: data.longitude,
        detected: true,
      };
    } catch (error) {
      console.log('Location detection error:', error);
      return null;
    }
  },

  /**
   * Detect location from a specific IP address
   * Useful for testing different locations
   *
   * @param ip - IP address to query (e.g., '8.8.8.8' for US, '1.1.1.1' for Australia)
   */
  async detectFromSpecificIP(ip: string): Promise<LocationData | null> {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);

      if (!response.ok) {
        console.log(
          `Location detection failed: HTTP ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const data: IpApiResponse = await response.json();

      if (data.error || !data.country_code) {
        console.log(
          'Location detection failed:',
          data.reason || 'Unknown error',
        );
        return null;
      }

      return {
        country: data.country_name || '',
        countryCode: data.country_code || '',
        region: data.region_code || '',
        regionName: data.region || '',
        city: data.city || '',
        lat: data.latitude,
        lon: data.longitude,
        detected: true,
      };
    } catch (error) {
      console.log('Location detection error:', error);
      return null;
    }
  },
};
