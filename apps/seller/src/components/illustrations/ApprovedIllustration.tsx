import React from 'react';
import { Image, ImageStyle } from 'react-native';

interface Props {
  width?: number;
  height?: number;
}

export function ApprovedIllustration({ width = 380, height = 340 }: Props) {
  return (
    <Image
      source={require('../../../assets/illustrations/approved.png')}
      style={{ width, height, resizeMode: 'contain' } as ImageStyle}
    />
  );
}
