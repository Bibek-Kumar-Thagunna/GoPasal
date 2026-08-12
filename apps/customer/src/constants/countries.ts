export type Country = {
  code: string;
  name: string;
  flag: string;
};

export const COUNTRIES: Country[] = [
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
];

export const DEFAULT_COUNTRY_CODE = '+977';

export function getCountryByCode(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}
