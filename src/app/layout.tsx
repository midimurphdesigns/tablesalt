import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tablesalt.kevinmurphywebdev.com'),
  title: 'tablesalt — drop a CSV, ask a question, see generative UI',
  description:
    'In-browser data exploration agent. Text-to-SQL via Vercel AI SDK over DuckDB-WASM, generative UI as the response, eval scoreboard on the front page. Built by Kevin Murphy.',
  openGraph: {
    title: 'tablesalt',
    description:
      'Drop a CSV. Ask a question. See generative UI. text-to-SQL + DuckDB-WASM + evals.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', creator: '@midimurphdesigns' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Space+Grotesk:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
