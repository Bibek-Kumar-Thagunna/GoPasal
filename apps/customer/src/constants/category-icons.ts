const ICON_BASE = 'https://img.icons8.com/color/256';

function icon(slug: string): string {
  return `${ICON_BASE}/${slug}.png`;
}

/** Slug → Icons8 color icon URL. Store onboarding slugs are listed first. */
export const CATEGORY_ICONS: Record<string, any> = {
  grocery: require('../../assets/categories/grocery.png'),
  'photo-print': require('../../assets/categories/photo-print.png'),
  restaurant: require('../../assets/categories/restaurant.png'),
  apparel: require('../../assets/categories/fashion.png'),
  electronics: require('../../assets/categories/electronics.png'),
  'health-beauty': require('../../assets/categories/health-beauty.png'),
  service: require('../../assets/categories/service.png'),
  groceries: require('../../assets/categories/grocery.png'),
  'fresh-produce': icon('group-of-fruits'),
  'beauty-wellness': require('../../assets/categories/health-beauty.png'),
  beauty: require('../../assets/categories/health-beauty.png'),
  'home-kitchen': icon('kitchen'),
  home: icon('kitchen'),
  services: require('../../assets/categories/service.png'),
  food: require('../../assets/categories/restaurant.png'),
  beverages: icon('soda-cup'),
  health: require('../../assets/categories/health-beauty.png'),
  fashion: require('../../assets/categories/fashion.png'),
  sports: icon('basketball'),
  toys: icon('teddy-bear'),
  books: icon('book'),
  pets: icon('cat-footprint'),
  automotive: icon('car'),
  pharmacy: icon('pill'),
  default: icon('shopping-bag'),
};

type NameMatcher = { match: (name: string) => boolean; key: keyof typeof CATEGORY_ICONS };

const NAME_MATCHERS: NameMatcher[] = [
  { match: (n) => n.includes('photo') || n.includes('print') || n.includes('studio'), key: 'photo-print' },
  { match: (n) => n.includes('grocer') || n.includes('supermarket') || n.includes('kirana'), key: 'grocery' },
  { match: (n) => n.includes('restaurant') || n.includes('dine') || n.includes('dining') || n.includes('kitchen'), key: 'restaurant' },
  { match: (n) => n.includes('fashion') || n.includes('cloth') || n.includes('apparel') || n.includes('wear') || n.includes('garment'), key: 'apparel' },
  { match: (n) => n.includes('electronic') || n.includes('gadget') || n.includes('tech') || n.includes('laptop') || n.includes('phone') || n.includes('mobile'), key: 'electronics' },
  { match: (n) => n.includes('beauty') || n.includes('cosmet') || n.includes('makeup') || n.includes('make-up') || n.includes('spa') || n.includes('wellness'), key: 'health-beauty' },
  { match: (n) => n.includes('health') || n.includes('fitness') || n.includes('gym'), key: 'health' },
  { match: (n) => n.includes('service') || n.includes('repair') || n.includes('salon') || n.includes('laundry') || n.includes('professional'), key: 'service' },
  { match: (n) => n.includes('vegetable') || n.includes('veggie') || n.includes('organic'), key: 'fresh-produce' },
  { match: (n) => n.includes('fruit') || n.includes('produce') || n.includes('fresh'), key: 'fresh-produce' },
  { match: (n) => n.includes('pizza'), key: 'food' },
  { match: (n) => n.includes('fast') || n.includes('burger'), key: 'food' },
  { match: (n) => n.includes('snack') || n.includes('chips'), key: 'food' },
  { match: (n) => n.includes('cake') || n.includes('pastry') || n.includes('dessert') || n.includes('sweet'), key: 'food' },
  { match: (n) => n.includes('bread') || n.includes('baker'), key: 'food' },
  { match: (n) => n.includes('coffee') || n.includes('tea') || n.includes('cafe'), key: 'beverages' },
  { match: (n) => n.includes('drink') || n.includes('beverage') || n.includes('juice') || n.includes('soda') || n.includes('water'), key: 'beverages' },
  { match: (n) => n.includes('dairy') || n.includes('milk'), key: 'groceries' },
  { match: (n) => n.includes('meat') || n.includes('chicken') || n.includes('mutton') || n.includes('pork'), key: 'groceries' },
  { match: (n) => n.includes('fish') || n.includes('seafood'), key: 'groceries' },
  { match: (n) => n.includes('pharma') || n.includes('medic') || n.includes('drug'), key: 'pharmacy' },
  { match: (n) => n.includes('clinic') || n.includes('doctor'), key: 'pharmacy' },
  { match: (n) => n.includes('home') || n.includes('household') || n.includes('furnitur') || n.includes('decor'), key: 'home' },
  { match: (n) => n.includes('sport'), key: 'sports' },
  { match: (n) => n.includes('toy') || n.includes('baby') || n.includes('kid') || n.includes('child'), key: 'toys' },
  { match: (n) => n.includes('book') || n.includes('station'), key: 'books' },
  { match: (n) => n.includes('pet') || n.includes('animal'), key: 'pets' },
  { match: (n) => n.includes('auto') || n.includes('car') || n.includes('vehicle') || n.includes('motor'), key: 'automotive' },
  { match: (n) => n.includes('food'), key: 'restaurant' },
];

export function resolveCategoryIconUrl(slug?: string, name?: string): any {
  const normalizedSlug = slug?.trim().toLowerCase();
  if (normalizedSlug && CATEGORY_ICONS[normalizedSlug]) {
    return CATEGORY_ICONS[normalizedSlug];
  }

  const lower = (name ?? slug ?? '').trim().toLowerCase();
  if (lower) {
    const matcher = NAME_MATCHERS.find((m) => m.match(lower));
    if (matcher) {
      return CATEGORY_ICONS[matcher.key];
    }
  }

  return CATEGORY_ICONS.default;
}
