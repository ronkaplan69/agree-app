import type { Principle } from '../api';

export type RootStackParamList = {
  Home: undefined;
  Email: undefined;
  Login: undefined;
  VerifyCode: { email: string; bypass?: boolean };
  Principles: undefined;
  MyPrinciples: undefined;
  PrincipleDetail: { principle: Principle };
  Status: undefined;
};
