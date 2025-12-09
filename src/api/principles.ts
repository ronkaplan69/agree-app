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
  async getMyAgreed() {
    return api.get<{ principles: Principle[]; count: number }>(
      '/principles/user/agreed',
    );
  },
};
