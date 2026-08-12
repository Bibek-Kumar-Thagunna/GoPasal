export const APP = {
  name: 'GoPasal',
  tagline: 'Your Neighborhood Marketplace',
  version: '2.0.0',
} as const;

/** Display prefix for all prices in the customer app. */
export const CURRENCY_SYMBOL = 'Rs ';

export const PAGINATION = {
  defaultLimit: 20,
  defaultPage: 1,
} as const;

export const STORAGE_KEYS = {
  accessToken: 'gp_access_token',
  refreshToken: 'gp_refresh_token',
  onboardingCompleted: 'gp_onboarding_completed',
  selectedLocation: 'gp_selected_location',
} as const;

export const QUERY_KEYS = {
  auth: { me: ['auth', 'me'] },
  categories: { all: ['categories'], trending: ['categories', 'trending'] },
  storeCategories: { all: ['store-categories'] },
  products: {
    popular: (locationId?: string) => ['products', 'popular', locationId],
    search: (query: string) => ['products', 'search', query],
    byId: (id: string) => ['products', id],
    byCategory: (catId: string) => ['products', 'category', catId],
    byStore: (storeId: string) => ['products', 'store', storeId],
  },
  stores: {
    list: (lat?: number, lon?: number) => ['stores', lat, lon],
    byId: (id: string) => ['stores', id],
  },
  cart: ['cart'],
  orders: {
    list: ['orders'],
    byId: (id: string) => ['orders', id],
  },
  addresses: ['addresses'],
  wishlist: ['wishlist'],
  notifications: ['notifications'],
  offers: ['offers'],
  reviews: {
    byProduct: (productId: string) => ['reviews', productId],
  },
} as const;
