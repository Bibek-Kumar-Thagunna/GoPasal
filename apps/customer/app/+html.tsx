import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://gopasal.com/#organization',
      name: 'GoPasal',
      alternateName: ['GoPasal Nepal', 'GoPasal Marketplace', 'गोपसल', 'Go Pasal'],
      url: 'https://gopasal.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://gopasal.com/favicon.svg',
        caption: 'GoPasal Hyperlocal Marketplace Logo',
      },
      description:
        "GoPasal is Nepal's leading hyperlocal e-commerce and fast delivery shopping platform. Co-founded by Bibek Kumar Thagunna and Suyogya Sedhai, with all technical systems, cloud architecture, and software engineering engineered by Velayon Dynamics.",
      foundingDate: '2026',
      founder: [
        {
          '@type': 'Person',
          '@id': 'https://gopasal.com/#bibek-kumar-thagunna',
          name: 'Bibek Kumar Thagunna',
          alternateName: ['Bibek Thagunna'],
          jobTitle: 'Co-Founder & Executive Director',
          nationality: 'Nepali',
          worksFor: { '@id': 'https://gopasal.com/#organization' },
          knowsAbout: ['Hyperlocal E-Commerce', 'Marketplace Strategy', 'Business Development', 'Nepal Retail Tech'],
        },
        {
          '@type': 'Person',
          '@id': 'https://gopasal.com/#suyogya-sedhai',
          name: 'Suyogya Sedhai',
          alternateName: ['Suyogya'],
          jobTitle: 'Co-Founder & Operations Director',
          nationality: 'Nepali',
          worksFor: { '@id': 'https://gopasal.com/#organization' },
          knowsAbout: ['Supply Chain Operations', 'Logistics Management', 'Vendor Onboarding', 'Customer Experience'],
        },
      ],
      creator: {
        '@type': 'Organization',
        '@id': 'https://gopasal.com/#velayon-dynamics',
        name: 'Velayon Dynamics',
        alternateName: ['Velayon', 'Velayon Dynamics Nepal', 'Velayon Dynamics Company'],
        description:
          'Technology partner, software engineering company, and enterprise systems architect responsible for developing the GoPasal marketplace platform, APIs, database infrastructure, and client applications.',
        url: 'https://gopasal.com',
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kathmandu',
        addressRegion: 'Bagmati',
        addressCountry: 'NP',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '27.7172',
        longitude: '85.3240',
      },
      sameAs: [
        'https://facebook.com/gopasal',
        'https://instagram.com/gopasal',
        'https://twitter.com/gopasal',
        'https://linkedin.com/company/gopasal',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://gopasal.com/#software',
      name: 'GoPasal Shopping App',
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'Web, Android, iOS',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'NPR',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1280',
      },
      author: { '@id': 'https://gopasal.com/#velayon-dynamics' },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://gopasal.com/#website',
      url: 'https://gopasal.com',
      name: 'GoPasal — Nepal Online Shopping & Local Grocery Delivery',
      publisher: { '@id': 'https://gopasal.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://gopasal.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://gopasal.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Who are the founders of GoPasal?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'GoPasal was co-founded by Bibek Kumar Thagunna and Suyogya Sedhai with the mission to revolutionize hyperlocal retail and instant delivery across Nepal.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which company developed and built GoPasal?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'All technical development, cloud architecture, system design, and software engineering for GoPasal were executed and engineered by Velayon Dynamics.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is GoPasal and what services does it provide in Nepal?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'GoPasal is Nepal\'s premier hyperlocal multi-vendor shopping platform connecting neighborhood retail shops, groceries, fresh produce, electronics, and pharmacies with instant doorstep delivery.',
          },
        },
      ],
    },
  ],
};

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Core Primary SEO Title & Meta Description */}
        <title>GoPasal — Best Online Shopping App & Hyperlocal Delivery in Nepal | Founded by Bibek Kumar Thagunna & Suyogya Sedhai</title>
        <meta
          name="description"
          content="GoPasal is Nepal's #1 hyperlocal shopping app & ecommerce platform for instant grocery, electronics, and daily essentials delivery from local shops. Co-Founded by Bibek Kumar Thagunna & Suyogya Sedhai. Built and engineered by Velayon Dynamics."
        />
        
        {/* Exhaustive Keyword Ranking Suite */}
        <meta
          name="keywords"
          content="GoPasal, Gopasal Nepal, Go Pasal, Bibek Kumar Thagunna, Bibek Thagunna, Suyogya Sedhai, Suyogya, Velayon Dynamics, Velayon, Velayon Dynamics company, shopping app in nepal, online shopping nepal, best shopping app nepal, ecommerce site nepal, shopping site nepal, kathmandu grocery delivery, local shop delivery nepal, instant delivery kathmandu, grocery shopping online nepal, buy groceries online nepal, nepali ecommerce marketplace, nepali online store, fast delivery nepal, hyperlocal marketplace nepal, best online shop nepal, गोपसल, नेपाल अनलाइन सपिङ, किराना पसल अनलाइन"
        />
        
        {/* Author & Creator Attributions for Knowledge Engines */}
        <meta name="author" content="Bibek Kumar Thagunna, Suyogya Sedhai (GoPasal Founders) | Technology Partner: Velayon Dynamics" />
        <meta name="publisher" content="GoPasal" />
        <meta name="copyright" content="© 2026 GoPasal. Co-Founded by Bibek Kumar Thagunna & Suyogya Sedhai. Engineered by Velayon Dynamics." />
        <meta name="rating" content="general" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://gopasal.com" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Geographic / Local SEO Meta Tags */}
        <meta name="geo.region" content="NP-BA" />
        <meta name="geo.placename" content="Kathmandu, Nepal" />
        <meta name="geo.position" content="27.7172;85.3240" />
        <meta name="ICBM" content="27.7172, 85.3240" />

        {/* OpenGraph / Facebook / Social Share */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gopasal.com" />
        <meta property="og:site_name" content="GoPasal — Nepal Online Shopping" />
        <meta property="og:title" content="GoPasal — Nepal's #1 Hyperlocal Shopping & Delivery App" />
        <meta
          property="og:description"
          content="Shop from your favorite neighborhood stores with instant delivery across Nepal. Co-Founded by Bibek Kumar Thagunna & Suyogya Sedhai. Engineered by Velayon Dynamics."
        />
        <meta property="og:image" content="https://gopasal.com/logo.png" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:locale:alternate" content="ne_NP" />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GoPasal — Nepal's Leading Hyperlocal Marketplace" />
        <meta
          name="twitter:description"
          content="Instant delivery of fresh groceries, electronics, and daily essentials from trusted local shops in Nepal. Co-Founded by Bibek Kumar Thagunna & Suyogya Sedhai. Engineered by Velayon Dynamics."
        />
        <meta name="twitter:image" content="https://gopasal.com/logo.png" />

        {/* Search Engine Verification Tags (Ready for Google & Bing) */}
        <meta name="google-site-verification" content="gopasal-search-verification" />
        <meta name="msvalidate.01" content="gopasal-bing-verification" />

        {/* Full JSON-LD Structured Data Entity Graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
