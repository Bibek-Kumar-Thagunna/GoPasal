export interface SellerOnboardingCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
}

export const SELLER_ONBOARDING_CATEGORIES: SellerOnboardingCategory[] = [
  {
    id: 'grocery',
    name: 'Grocery Store',
    icon: 'cart-outline',
    description: 'Fresh produce, packaged foods, daily essentials',
    color: '#22C55E',
    bgColor: '#DCFCE7',
  },
  {
    id: 'photo-print',
    name: 'Photo & Print',
    icon: 'images-outline',
    description: 'Photo printing, ID & passport photos, lamination, large-format, custom prints',
    color: '#C026D3',
    bgColor: '#FAE8FF',
  },
  {
    id: 'restaurant',
    name: 'Restaurant / Kitchen',
    icon: 'restaurant-outline',
    description: 'Ready meals, cloud kitchen, dine-in service',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    id: 'apparel',
    name: 'Fashion',
    icon: 'shirt-outline',
    description: 'Clothing, footwear, accessories, jewelry',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
  },
  {
    id: 'electronics',
    name: 'Electronics & Tech',
    icon: 'phone-portrait-outline',
    description: 'Phones, laptops, gadgets, accessories',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    icon: 'heart-outline',
    description: 'Cosmetics, skincare, pharmacy, wellness',
    color: '#EC4899',
    bgColor: '#FCE7F3',
  },
  {
    id: 'service',
    name: 'Service Business',
    icon: 'construct-outline',
    description: 'Laundry, repair, salon, professional services',
    color: '#14B8A6',
    bgColor: '#CCFBF1',
  },
];

const I18N_KEYS: Record<string, { nameKey: string; descKey: string }> = {
  grocery: { nameKey: 'category.grocery', descKey: 'category.groceryDesc' },
  'photo-print': { nameKey: 'category.photoPrint', descKey: 'category.photoPrintDesc' },
  restaurant: { nameKey: 'category.restaurant', descKey: 'category.restaurantDesc' },
  apparel: { nameKey: 'category.fashion', descKey: 'category.fashionDesc' },
  electronics: { nameKey: 'category.electronics', descKey: 'category.electronicsDesc' },
  'health-beauty': { nameKey: 'category.health', descKey: 'category.healthDesc' },
  service: { nameKey: 'category.services', descKey: 'category.servicesDesc' },
};

export function translateSellerOnboardingCategories(
  t: (key: string) => string,
): SellerOnboardingCategory[] {
  return SELLER_ONBOARDING_CATEGORIES.map((c) => {
    const keys = I18N_KEYS[c.id];
    if (!keys) return c;
    return {
      ...c,
      name: t(keys.nameKey),
      description: t(keys.descKey),
    };
  });
}
