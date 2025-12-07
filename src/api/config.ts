// API Configuration
// For iOS simulator: use localhost
// For Android emulator: use 10.0.2.2 (maps to host machine's localhost)
// For physical device: use your computer's local IP address

import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (__DEV__) {
    // Development
    return Platform.select({
      ios: 'http://localhost:3004',
      android: 'http://10.0.2.2:3004',
      default: 'http://localhost:3004',
    });
  }
  // Production - replace with your actual API URL
  return 'https://api.agree.com';
};

export const API_CONFIG = {
  baseUrl: getBaseUrl(),
  version: 'v1',
  timeout: 10000,
};

export const API_URL = `${API_CONFIG.baseUrl}/api/${API_CONFIG.version}`;
