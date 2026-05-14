import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'tablesalt — drop a CSV, ask a question, see generative UI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0a0b',
          color: '#f5f1ea',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 8,
              height: 22,
              background: '#4dffff',
              boxShadow: '0 0 16px rgba(77,255,255,0.6)',
            }}
          />
          <span
            style={{
              fontSize: 18,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#6f6d68',
              fontFamily: 'monospace',
            }}
          >
            tablesalt · csv agent
          </span>
        </div>

        {/* Title — large display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1,
              fontStyle: 'italic',
              fontFamily: 'serif',
              letterSpacing: '-0.04em',
              color: '#f5f1ea',
              display: 'flex',
            }}
          >
            Drop a CSV.
          </div>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1,
              fontStyle: 'italic',
              fontFamily: 'serif',
              letterSpacing: '-0.04em',
              color: '#f5f1ea',
              display: 'flex',
            }}
          >
            Ask a question.
          </div>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1,
              fontStyle: 'italic',
              fontFamily: 'serif',
              letterSpacing: '-0.04em',
              color: '#4dffff',
              display: 'flex',
            }}
          >
            See generative UI.
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderTop: '1px solid #1f1f23',
            paddingTop: 24,
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: '#b2b0ab',
              fontFamily: 'monospace',
            }}
          >
            tablesalt.kevinmurphywebdev.com
          </span>
          <span
            style={{
              fontSize: 18,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#6f6d68',
              fontFamily: 'monospace',
            }}
          >
            by kevin murphy
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
