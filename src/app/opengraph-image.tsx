import { ImageResponse } from 'next/og';

// PLACEHOLDER social-share image (shows when a link to the site is shared on WhatsApp/social).
// Swap for a real designed image by replacing this file with a static opengraph-image.png/jpg
// in this same folder — Next.js picks up either convention automatically.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static'; // this project builds with output: 'export'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#131d27',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', width: '160px', height: '24px', background: '#bbd440', marginBottom: '48px' }} />
        <div style={{ display: 'flex', color: '#fff', fontSize: 84, fontWeight: 700, letterSpacing: '-2px' }}>
          Creative Screens
        </div>
        <div style={{ display: 'flex', color: 'rgba(255,255,255,0.65)', fontSize: 32, marginTop: '20px' }}>
          Printing, signage and LED screens in Muscat
        </div>
      </div>
    ),
    { ...size },
  );
}
