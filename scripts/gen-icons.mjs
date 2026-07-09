import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const font = join(root, 'node_modules/@expo-google-fonts/great-vibes/GreatVibes_400Regular.ttf');
const out = join(root, 'assets');
mkdirSync(out, { recursive: true });

const OBSIDIAN = '#0a0806';
const CRIMSON = '#c0392b';
const GOLD = '#d4a574';

// Cursive "V" rendered from the real Great Vibes face, crimson with a soft gold glow.
// `bg`   = full-bleed obsidian square (icon.png)
// `fg`   = transparent ground, V inset to the adaptive-icon safe zone (adaptive-icon.png)
function svg({ bg, size = 1024, fontPx, cy }) {
  const glow = `<filter id="g" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="${size * 0.012}" flood-color="${GOLD}" flood-opacity="0.55"/>
    </filter>`;
  const ground = bg
    ? `<rect width="${size}" height="${size}" fill="${OBSIDIAN}"/>
       <circle cx="${size / 2}" cy="${size * 0.34}" r="${size * 0.5}" fill="${GOLD}" opacity="0.05"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>${glow}</defs>
    ${ground}
    <text x="50%" y="${cy}" text-anchor="middle"
          font-family="Great Vibes" font-size="${fontPx}"
          fill="${CRIMSON}" filter="url(#g)">V</text>
  </svg>`;
}

function render(spec, file, size) {
  const r = new Resvg(svg(spec), {
    fitTo: { mode: 'width', value: size },
    font: { fontFiles: [font], defaultFontFamily: 'Great Vibes', loadSystemFonts: false },
    background: 'rgba(0,0,0,0)',
  });
  writeFileSync(join(out, file), r.render().asPng());
  console.log('wrote', file, size + 'px');
}

// icon.png — full-bleed obsidian, V large & centered
render({ bg: true,  fontPx: 760, cy: '70%' }, 'icon.png', 1024);
// adaptive-icon.png — transparent fg, V inset ~66% for Android mask safe zone
render({ bg: false, fontPx: 560, cy: '64%' }, 'adaptive-icon.png', 1024);
// splash-icon.png — same as icon on transparent, smaller for splash
render({ bg: false, fontPx: 620, cy: '66%' }, 'splash-icon.png', 1024);
// favicon.png — web
render({ bg: true,  fontPx: 760, cy: '70%' }, 'favicon.png', 128);
