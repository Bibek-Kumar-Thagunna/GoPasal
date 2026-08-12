import React from 'react';
import { LegalScreen, type LegalSection } from '../src/components/LegalScreen';

const SECTIONS: LegalSection[] = [
  { titleKey: 'terms.s1.title', bodyKey: 'terms.s1.body' },
  { titleKey: 'terms.s2.title', bodyKey: 'terms.s2.body' },
  { titleKey: 'terms.s3.title', bodyKey: 'terms.s3.body' },
  { titleKey: 'terms.s4.title', bodyKey: 'terms.s4.body' },
  { titleKey: 'terms.s5.title', bodyKey: 'terms.s5.body' },
  { titleKey: 'terms.s6.title', bodyKey: 'terms.s6.body' },
  { titleKey: 'terms.s7.title', bodyKey: 'terms.s7.body' },
  { titleKey: 'terms.s8.title', bodyKey: 'terms.s8.body' },
  { titleKey: 'terms.s9.title', bodyKey: 'terms.s9.body' },
  { titleKey: 'terms.s10.title', bodyKey: 'terms.s10.body' },
  { titleKey: 'terms.s11.title', bodyKey: 'terms.s11.body' },
  { titleKey: 'terms.s12.title', bodyKey: 'terms.s12.body' },
];

export default function TermsScreen() {
  return (
    <LegalScreen
      titleKey="terms.title"
      introKey="terms.intro"
      sections={SECTIONS}
      contactBodyKey="terms.contactBody"
      lastUpdated="June 1, 2026"
    />
  );
}
