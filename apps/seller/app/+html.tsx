import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* SEO Meta Tags */}
        <title>GoPasal Seller Merchant Portal — Grow Your Business in Nepal</title>
        <meta
          name="description"
          content="Sell your products on GoPasal and reach thousands of local customers across Nepal with instant delivery. Co-Founded by Bibek Kumar Thagunna & Suyogya Sedhai. Engineered by Velayon Dynamics."
        />
        <meta
          name="keywords"
          content="GoPasal Seller, Merchant Portal Nepal, Sell Online Nepal, Hyperlocal Seller, Bibek Kumar Thagunna, Suyogya Sedhai, Velayon Dynamics"
        />
        <link rel="canonical" href="https://seller.gopasal.com" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* OpenGraph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://seller.gopasal.com" />
        <meta property="og:title" content="GoPasal Seller Merchant Portal" />
        <meta
          property="og:description"
          content="Register your shop, manage inventory, track orders, and boost your sales on GoPasal. Co-Founded by Bibek Kumar Thagunna & Suyogya Sedhai. Engineered by Velayon Dynamics."
        />
        <meta property="og:site_name" content="GoPasal Seller" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
