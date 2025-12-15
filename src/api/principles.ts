import { api } from './client';

export type Principle = {
  _id: string;
  text: string;
  createdBy: string;
  agreementCount: number;
  userAgreed: boolean;
  createdAt: string;
};

type PrinciplesResponse = {
  principles: Principle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

type PrincipleResponse = {
  principle: Principle;
};

type AgreementResponse = {
  principleId: string;
  agreementCount: number;
  userAgreed: boolean;
};

export const principlesApi = {
  /**
   * Get all principles
   */
  async getAll(page = 1, limit = 20, search?: string) {
    let endpoint = `/principles?page=${page}&limit=${limit}`;
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }
    return api.get<PrinciplesResponse>(endpoint);
  },

  /**
   * Get a single principle
   */
  async getById(id: string) {
    return api.get<PrincipleResponse>(`/principles/${id}`);
  },

  /**
   * Create a new principle (auto-agrees)
   */
  async create(text: string) {
    return api.post<PrincipleResponse>('/principles', { text });
  },

  /**
   * Agree with a principle
   */
  async agree(id: string) {
    return api.post<AgreementResponse>(`/principles/${id}/agree`);
  },

  /**
   * Remove agreement
   */
  async removeAgreement(id: string) {
    return api.delete<AgreementResponse>(`/principles/${id}/agree`);
  },

  /**
   * Get principles user agreed with
   */
  async getMyAgreed(page = 1, limit = 100, search?: string) {
    let endpoint = `/principles/user/agreed?page=${page}&limit=${limit}`;
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }
    return api.get<PrinciplesResponse>(endpoint);
  },

  /**
   * Get country agreement percentages for a set of principles
   * Returns the average percentage of principles that users from each country agree with
   *
   * @param principleIds - Array of principle IDs. If provided, userId is ignored.
   * @param userId - User ID. Used only if principleIds is not provided. Fetches all principles this user agrees with.
   */
  async getCountryAgreementPercentages(
    principleIds?: string[],
    userId?: string,
  ) {
    return api.post<{
      countries: Array<{
        country: {
          _id: string;
          name: string;
          code: string;
        };
        percentage: number; // Average percentage of principles that users in this country agree with
      }>;
      count: number;
    }>('/principles/analytics/country-agreement-percentages', {
      ...(principleIds && { principleIds }),
      ...(userId && { userId }),
    });
  },
};
