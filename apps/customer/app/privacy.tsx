import React from 'react';
import { LegalScreen, type LegalSection } from '../src/components/LegalScreen';

const SECTIONS: LegalSection[] = [
  { titleKey: 'privacy.s1.title', bodyKey: 'privacy.s1.body' },
  { titleKey: 'privacy.s2.title', bodyKey: 'privacy.s2.body' },
  { titleKey: 'privacy.s3.title', bodyKey: 'privacy.s3.body' },
  { titleKey: 'privacy.s4.title', bodyKey: 'privacy.s4.body' },
  { titleKey: 'privacy.s5.title', bodyKey: 'privacy.s5.body' },
  { titleKey: 'privacy.s6.title', bodyKey: 'privacy.s6.body' },
  { titleKey: 'privacy.s7.title', bodyKey: 'privacy.s7.body' },
  { titleKey: 'privacy.s8.title', bodyKey: 'privacy.s8.body' },
  { titleKey: 'privacy.s9.title', bodyKey: 'privacy.s9.body' },
];

export default function PrivacyScreen() {
  return (
    <LegalScreen
      titleKey="privacy.title"
      introKey="privacy.intro"
      sections={SECTIONS}
      contactBodyKey="privacy.contactBody"
      lastUpdated="June 1, 2026"
    />
  );
}
