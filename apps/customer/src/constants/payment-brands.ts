import type { ImageSourcePropType } from 'react-native';
import type { PaymentMethod } from '../types';

export const PAYMENT_BRAND_ASSETS: Partial<Record<PaymentMethod, ImageSourcePropType>> = {
  KHALTI: require('../../assets/payments/khalti.png'),
  ESEWA: require('../../assets/payments/esewa.png'),
};

export const PAYMENT_BRAND_COLORS: Partial<Record<PaymentMethod, string>> = {
  KHALTI: '#D31F2A',
  ESEWA: '#60BB46',
};
