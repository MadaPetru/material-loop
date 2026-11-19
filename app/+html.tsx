import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_DESCRIPTION_EN,
  DEFAULT_TITLE,
  OG_IMAGE_URL,
  SITE_NAME,
  SITE_URL,
  siteJsonLd,
} from '@/lib/seo';

/**
 * Web-only root HTML for static rendering (Expo Router).
 * Runs in Node during `expo export` — no browser APIs.
 * SDK 58+: must render headNodes/bodyNodes from useServerDocumentContext().
 */
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  const jsonLd = JSON.stringify(siteJsonLd());

  return (
    <html lang="ro" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#2F5D3A" />
        <meta name="color-scheme" content="light" />
        <meta name="format-detection" content="telephone=no,address=no,email=no" />

        {/* Fallback SEO — route generateMetadata() overrides via headNodes below. */}
        <title>{DEFAULT_TITLE}</title>
        <meta name="description" content={DEFAULT_DESCRIPTION} />
        <meta
          name="keywords"
          content="MaterialLoop, materiale construcții, surplus șantier, materiale rămase, marketplace România"
        />
        <link rel="canonical" href={SITE_URL} />
        <link rel="alternate" hrefLang="ro-RO" href={SITE_URL} />
        <link rel="alternate" hrefLang="en" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="ro_RO" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={DEFAULT_TITLE} />
        <meta property="og:description" content={DEFAULT_DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE_URL} />
        <meta property="og:image:alt" content={`${SITE_NAME} logo`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={DEFAULT_TITLE} />
        <meta name="twitter:description" content={DEFAULT_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE_URL} />

        <meta name="ai-content-declaration" content="human-created" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {/* Crawlable copy when JS is off or crawlers skip hydration. */}
        <noscript>
          <main
            style={{
              fontFamily:
                'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
              maxWidth: 720,
              margin: '2rem auto',
              padding: '0 1.25rem',
              lineHeight: 1.55,
              color: '#1a1a1a',
            }}
          >
            <h1>{SITE_NAME}</h1>
            <p>{DEFAULT_DESCRIPTION}</p>
            <p>{DEFAULT_DESCRIPTION_EN}</p>
            <p>
              <a href={SITE_URL}>Acasă</a>
              {' · '}
              <a href={`${SITE_URL}/search`}>Caută anunțuri</a>
              {' · '}
              <a href={`${SITE_URL}/legal/privacy`}>Confidențialitate</a>
              {' · '}
              <a href={`${SITE_URL}/legal/terms`}>Termeni</a>
            </p>
            <p>
              Enable JavaScript for the full {SITE_NAME} app experience. / Activează JavaScript
              pentru aplicația completă.
            </p>
          </main>
        </noscript>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

const responsiveBackground = `
html, body {
  background-color: #EDE9E2;
}
#root {
  display: flex;
  min-height: 100%;
  flex: 1;
}
`;
