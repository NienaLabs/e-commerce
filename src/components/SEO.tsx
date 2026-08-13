import React from 'react';
import Head from 'expo-router/head';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  schema?: any; // JSON-LD schema object
}

export function SEO({
  title = 'Konura | The Best E-commerce Store in Kumasi',
  description = 'Shop the latest trends in fashion, electronics, and home goods on Konura. Fast shipping and great prices in Kumasi, Ghana.',
  image = '/icon-192x192.png',
  url = 'https://konura.store',
  schema,
}: SEOProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Head>
  );
}
