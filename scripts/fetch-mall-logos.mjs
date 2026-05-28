/**
 * 쇼핑몰 실제 로고 다운로드 → apps/mobile/assets/images/malls/{platform}.png 로 번들.
 * 소스: Clearbit 로고 API → Google 파비콘 (둘 다 PNG 반환).
 * 실행:  node scripts/fetch-mall-logos.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'apps', 'mobile', 'assets', 'images', 'malls');
fs.mkdirSync(OUT, { recursive: true });

const MALLS = [
  { platform: 'coupang', domain: 'coupang.com' },
  { platform: 'naver', domain: 'naver.com' },
  { platform: '11st', domain: '11st.co.kr' },
  { platform: 'gmarket', domain: 'gmarket.co.kr' },
  { platform: 'ssg', domain: 'ssg.com' },
  { platform: 'lotteon', domain: 'lotteon.com' },
  { platform: 'wemakeprice', domain: 'wemakeprice.com' },
  { platform: 'tmon', domain: 'tmon.co.kr' },
];

function sources(d) {
  return [
    `https://logo.clearbit.com/${d}?size=256`,
    `https://www.google.com/s2/favicons?domain=${d}&sz=128`,
  ];
}

async function tryFetch(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) return null;
    const meta = await sharp(buf).metadata();
    if (!meta.width || meta.width < 32) return null;
    return { buf, meta };
  } catch {
    return null;
  }
}

let ok = 0;
for (const m of MALLS) {
  let got = null;
  let src = '';
  for (const url of sources(m.domain)) {
    const r = await tryFetch(url);
    if (r) {
      got = r;
      src = url.includes('clearbit') ? 'clearbit' : 'google';
      break;
    }
  }
  if (!got) {
    console.log(`✗ ${m.platform} — 모든 소스 실패`);
    continue;
  }
  const png = await sharp(got.buf)
    .resize(128, 128, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT, `${m.platform}.png`), png);
  ok++;
  console.log(`✓ ${m.platform}.png  (src=${src}, 원본 ${got.meta.width}x${got.meta.height})`);
}
console.log(`완료 — ${ok}/${MALLS.length} — ${OUT}`);
