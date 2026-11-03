import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

type ShareCard = { title: string; subtitle: string; detail?: string };

// Unpacked copies of the site's bundled Latin Fraunces and DM Sans.
// Local files only: image routes export to PNG at build time.
const fonts = Promise.all([
  readFile(join(process.cwd(), 'assets/fonts/fraunces-latin.ttf')),
  readFile(join(process.cwd(), 'assets/fonts/dm-sans-latin.ttf')),
]);

export async function shareImage({ title, subtitle, detail }: ShareCard) {
  const [serif, sans] = await fonts;
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#f5f4f2', color: '#0f2f66', fontFamily: 'DM Sans', fontWeight: 400, padding: '54px 64px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', position: 'absolute', inset: 18, border: '1px solid #dcdad5' }} />
      <div style={{ display: 'flex', position: 'absolute', right: -95, top: -180, width: 350, height: 700, background: '#0f2f66', opacity: 0.045, transform: 'rotate(25deg)' }} />
      <div style={{ display: 'flex', position: 'absolute', right: -20, bottom: -180, width: 190, height: 680, background: '#b1222f', opacity: 0.065, transform: 'rotate(25deg)' }} />
      <div style={{ display: 'flex', position: 'absolute', left: 0, top: 0, width: 820, height: 8, background: '#0f2f66' }} />
      <div style={{ display: 'flex', position: 'absolute', right: 0, top: 0, width: 380, height: 8, background: '#b1222f' }} />
      {/* KEVYN-WRITE: share-card brand lockup | facts: site name Midterm Watch; canonical host midtermwatch.com from lib/refresh.ts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 25 }}>
        <div style={{ display: 'flex', width: 8, height: 27, background: '#b1222f' }} />
        <span>Midterm Watch</span>
      </div>
      {/* KEVYN-WRITE: route-specific heading, subject and optional sourced detail | facts: copy provenance is documented in each opengraph-image.tsx caller */}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingBottom: 8 }}>
        <div style={{ display: 'flex', fontFamily: 'Fraunces', fontWeight: 900, fontSize: title.length > 24 ? 72 : 88, lineHeight: 1.05, letterSpacing: '-2px', maxWidth: 1030 }}>{title}</div>
        <div style={{ display: 'flex', fontSize: 37, lineHeight: 1.2, marginTop: 22, color: '#b1222f' }}>{subtitle}</div>
        {detail && <div style={{ display: 'flex', fontSize: 27, lineHeight: 1.35, marginTop: 20, color: '#3b4657', maxWidth: 1030 }}>{detail}</div>}
      </div>
      {/* KEVYN-WRITE: source-first footer and site address | facts: results pages link election authorities and publish no live counts or calls; canonicalOrigin in lib/refresh.ts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #c9c9c7', paddingTop: 18, fontSize: 20, color: '#535e70' }}>
        <span>Follow the sources.</span><span>midtermwatch.com</span>
      </div>
    </div>,
    { width: 1200, height: 630, fonts: [
      { name: 'Fraunces', data: serif, weight: 900, style: 'normal' },
      { name: 'DM Sans', data: sans, weight: 400, style: 'normal' },
    ] },
  );
}
