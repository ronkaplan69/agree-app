import { api } from './client';

export type Country = {
  _id: string;
  name: string;
  code: string;
};

type CountriesResponse = {
  countries: Country[];
};

type DetectCountryResponse = {
  country: Country | null;
  detected: boolean;
  message?: string;
};

export const countriesApi = {
  /**
   * Get all active countries
   */
  async getAll() {
    return api.get<CountriesResponse>('/countries', false);
  },

  /**
   * Detect country from IP
   */
  async detect() {
    return api.get<DetectCountryResponse>('/countries/detect', false);
  },
};
