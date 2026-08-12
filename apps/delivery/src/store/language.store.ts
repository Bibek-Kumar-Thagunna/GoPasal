import { create } from 'zustand';

export type Language = 'en' | 'ne';

interface Translations {
  [key: string]: { en: string; ne: string };
}

const translations: Translations = {
  'auth.title': { en: 'Delivery Partner Login', ne: 'डेलिभरी पार्टनर लगइन' },
  'auth.subtitle': { en: 'Sign in to start delivering', ne: 'डेलिभरी सुरु गर्न साइन इन गर्नुहोस्' },
  'auth.phone': { en: 'Phone Number', ne: 'फोन नम्बर' },
  'auth.sendOtp': { en: 'Send OTP', ne: 'OTP पठाउनुहोस्' },
  'auth.verifyOtp': { en: 'Verify OTP', ne: 'OTP प्रमाणित गर्नुहोस्' },
  'auth.otpSent': { en: 'OTP sent to your phone', ne: 'तपाईंको फोनमा OTP पठाइयो' },
  'auth.enterOtp': { en: 'Enter OTP Code', ne: 'OTP कोड प्रविष्ट गर्नुहोस्' },

  'nav.route': { en: 'Active Route', ne: 'सक्रिय मार्ग' },
  'nav.orders': { en: 'Orders', ne: 'अर्डरहरू' },
  'nav.earnings': { en: 'Earnings', ne: 'कमाई' },
  'nav.profile': { en: 'Profile', ne: 'प्रोफाइल' },

  'route.greeting': { en: 'Rider Active Route', ne: 'राइडर सक्रिय मार्ग' },
  'route.onDuty': { en: 'on Duty', ne: 'ड्युटीमा' },
  'route.gpsActive': { en: 'GPS Active', ne: 'GPS सक्रिय' },
  'route.noGps': { en: 'No GPS', ne: 'GPS छैन' },
  'route.noDeliveries': { en: 'No active deliveries', ne: 'कुनै सक्रिय डेलिभरी छैन' },
  'route.idle': { en: 'You are currently idle. Orders assigned to you will appear here.', ne: 'तपाईं अहिले खाली हुनुहुन्छ। तपाईंलाई दिइएका अर्डरहरू यहाँ देखिनेछन्।' },
  'route.mapPlaceholder': { en: 'Live tracking map will appear here', ne: 'लाइभ ट्र्याकिंग नक्शा यहाँ देखिनेछ' },
  'route.currentDeliveries': { en: 'Current Deliveries', ne: 'हालको डेलिभरीहरू' },

  'common.loading': { en: 'Loading...', ne: 'लोड हुँदैछ...' },
  'common.error': { en: 'Something went wrong', ne: 'केही गलत भयो' },
  'common.retry': { en: 'Try Again', ne: 'पुनः प्रयास गर्नुहोस्' },
  'common.back': { en: 'Back', ne: 'पछाडि' },
  'common.offline': { en: 'No internet connection', ne: 'इन्टरनेट जडान छैन' },
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en',
  setLanguage: (lang: Language) => set({ language: lang }),
  t: (key: string) => {
    const lang = get().language;
    return translations[key]?.[lang] || key;
  },
}));
