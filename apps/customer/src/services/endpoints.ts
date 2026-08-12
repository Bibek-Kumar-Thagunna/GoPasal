export const ENDPOINTS = {
  auth: {
    otpSend: '/auth/otp/send',
    otpVerify: '/auth/otp/verify',
    socialLogin: '/auth/social/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    me: '/auth/me',
    biometricChallenge: '/auth/biometric/challenge',
    biometricLogin: '/auth/biometric/login',
    silentVerify: '/auth/silent/verify',
  },
  profile: '/profile',
  addresses: {
    list: '/addresses',
    create: '/addresses',
    update: (id: string) => `/addresses/${id}`,
    delete: (id: string) => `/addresses/${id}`,
  },
  stores: {
    list: '/stores',
    byId: (id: string) => `/stores/${id}`,
  },
  categories: {
    list: '/categories',
  },
  storeCategories: {
    list: '/store-categories',
  },
  products: {
    list: '/products',
    byId: (id: string) => `/products/${id}`,
  },
  cart: {
    get: '/cart',
    addItem: '/cart/items',
    updateItem: (id: string) => `/cart/items/${id}`,
    removeItem: (id: string) => `/cart/items/${id}`,
    clear: '/cart',
  },
  orders: {
    checkout: '/orders/checkout',
    list: '/orders',
    byId: (id: string) => `/orders/${id}`,
    riderLocation: (id: string) => `/orders/${id}/rider-location`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    updateStatus: (id: string) => `/orders/${id}/status`,
  },
  search: {
    query: '/search',
  },
  reviews: {
    list: (productId: string) => `/reviews/product/${productId}`,
    create: '/reviews',
    pending: '/reviews/pending',
  },
  wishlist: {
    list: '/wishlist',
    toggle: '/wishlist/toggle',
  },
  payment: {
    config: '/payment/config',
    checkoutInit: '/payment/checkout/init',
    checkoutVerify: '/payment/checkout/verify',
    khaltiVerify: '/payment/khalti/verify',
    khaltiRetry: '/payment/khalti/retry',
    esewaVerify: '/payment/esewa/verify',
    esewaMockVerify: '/payment/esewa/mock-verify',
    esewaRetry: '/payment/esewa/retry',
  },
  billing: {
    subscriptionInit: '/billing/subscription/checkout/init',
    subscriptionVerify: '/billing/subscription/checkout/verify',
  },
  growth: {
    validateCoupon: '/growth/coupon/validate',
    subscriptionPlans: '/growth/subscription-plans',
    subscriptionMe: '/growth/subscription/me',
    subscribe: '/growth/subscription/subscribe',
    cancelSubscription: '/growth/subscription/cancel',
  },
  delivery: {
    eta: '/delivery/eta',
  },
  notifications: {
    list: '/notifications',
    read: (id: string) => `/notifications/${id}/read`,
    delete: (id: string) => `/notifications/${id}`,
    deleteAll: '/notifications',
  },
  offers: {
    list: '/offers',
  },
  disputes: {
    create: '/disputes',
    messages: (id: string) => `/disputes/${id}/messages`,
  },
} as const;
