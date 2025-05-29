export type FeatureSet = {
  maxWorkspaces: number;
  maxMembers: number;
  maxSocialAccounts: number;
  aiTokens: number;
  canUseAnalytics: boolean;
  // Add more features as needed
};

// Default features for expired or free users
export const DEFAULT_FEATURES: FeatureSet = {
  maxWorkspaces: 1,
  maxMembers: 3,
  maxSocialAccounts: 1,
  aiTokens: 100,
  canUseAnalytics: true,
};

// Map product IDs to feature sets
export const PRODUCT_FEATURES: Record<string, FeatureSet> = {
  // Basic Yearly
  pdt_WImcYTSJYqzRmu1VM1Pnp: {
    maxWorkspaces: 1,
    maxMembers: 3,
    maxSocialAccounts: 1,
    aiTokens: 100,
    canUseAnalytics: true,
  },
  // Pro Yearly
  pdt_TlcLgUlNjtlvyiYlJu5qP: {
    maxWorkspaces: 5,
    maxMembers: 10,
    maxSocialAccounts: 3,
    aiTokens: 500,
    canUseAnalytics: true,
  },
  // Super Yearly
  pdt_MJLYrI9KY3XkrS0NKpr03: {
    maxWorkspaces: 10,
    maxMembers: 20,
    maxSocialAccounts: 9999,
    aiTokens: 1000,
    canUseAnalytics: true,
  },
  // Add monthly and other plans here...
};

export const APPSUMO_STACK_FEATURES: Record<number, FeatureSet> = {
  1: PRODUCT_FEATURES["pdt_WImcYTSJYqzRmu1VM1Pnp"], // Basic
  3: PRODUCT_FEATURES["pdt_TlcLgUlNjtlvyiYlJu5qP"], // Pro
  5: PRODUCT_FEATURES["pdt_MJLYrI9KY3XkrS0NKpr03"], // Super
};
