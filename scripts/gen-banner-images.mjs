/**
 * 프로모 배너 이미지 생성 스크립트.
 * 루트 .env 의 OPENAI_API_KEY 로 OpenAI 이미지 API 호출 →
 * 배너 비율(2:1)로 중앙 크롭 + 리사이즈 + JPEG → apps/mobile/assets/images/banner-*.jpg
 * 실행:  node scripts/gen-banner-images.mjs
 * gpt-image-1 실패 시 dall-e-3 폴백.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const KEY = (env.match(/^OPENAI_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY) { console.error('OPENAI_API_KEY 없음'); process.exit(1); }

const OUT = path.join(ROOT, 'apps', 'mobile', 'assets', 'images');
fs.mkdirSync(OUT, { recursive: true });

const TARGET_RATIO = 2.0;   // 캐러셀 슬라이드 가로:세로
const TARGET_WIDTH = 1200;  // 최종 저장 너비

const STYLE =
  'A clean, editorial promotional banner for a shopping rewards app. ' +
  'Soft [BG] pastel background filling the whole banner. ' +
  'On the RIGHT HALF, a tidy row of three small white rounded photo cards, ' +
  'slightly tilted and gently overlapping, each card containing ONE clean studio product photo. ' +
  'The cards cast soft shadows. The LEFT 40% stays as clean empty soft pastel background, ' +
  'reserved for dark text overlay — keep it uncluttered. ' +
  'Bright, premium, polished, modern e-commerce style. ' +
  'Absolutely no text, no words, no letters, no numbers, no brand logos.';

function spec(name, bg, cards) {
  return { name, prompt: `${STYLE.replace('[BG]', bg)} The three product photo cards show: ${cards}.` };
}

const SPECS = [
  spec('banner-guide', 'peach', 'a pastel pink travel suitcase, a black game controller, a white sneaker'),
  spec('banner-signup', 'warm cream', 'a wrapped gift box, a paper shopping bag, a small stack of gold coins'),
  spec('banner-tier', 'soft lilac', 'a luxury wristwatch, a leather handbag, a pair of sunglasses'),
  spec('banner-travel', 'soft sky blue', 'a travel suitcase, a camera, a straw sun hat'),
  spec('banner-fashion', 'soft pink', 'a folded knit sweater, a handbag, a high-heel shoe'),
];

async function generate(model, prompt) {
  const body = model === 'gpt-image-1'
    ? { model, prompt, size: '1536x1024', quality: 'high', n: 1 }
    : { model, prompt, size: '1792x1024', quality: 'standard', response_format: 'b64_json', n: 1 };
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message || JSON.stringify(json);
    const err = new Error(`${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  return Buffer.from(json.data[0].b64_json, 'base64');
}

// 원본을 배너 비율로 중앙 크롭 → 리사이즈 → JPEG
async function toBanner(buf) {
  const meta = await sharp(buf).metadata();
  let cw = meta.width;
  let ch = Math.round(cw / TARGET_RATIO);
  if (ch > meta.height) {
    ch = meta.height;
    cw = Math.round(ch * TARGET_RATIO);
  }
  const left = Math.round((meta.width - cw) / 2);
  const top = Math.round((meta.height - ch) / 2);
  return sharp(buf)
    .extract({ left, top, width: cw, height: ch })
    .resize(TARGET_WIDTH)
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}

let model = process.env.IMG_MODEL || 'gpt-image-1';
console.log(`배너 ${SPECS.length}개 생성 (model=${model}, ${TARGET_RATIO}:1, 가장자리 여백 구도)`);

let total = 0;
for (const s of SPECS) {
  let raw;
  try {
    raw = await generate(model, s.prompt);
  } catch (e) {
    if (model === 'gpt-image-1') {
      console.warn(`gpt-image-1 실패(${e.message}) → dall-e-3 폴백`);
      model = 'dall-e-3';
      raw = await generate(model, s.prompt);
    } else {
      throw e;
    }
  }
  const jpg = await toBanner(raw);
  const file = path.join(OUT, `${s.name}.jpg`);
  fs.writeFileSync(file, jpg);
  total += jpg.length;
  console.log(`✓ ${s.name}.jpg  (${(jpg.length / 1024).toFixed(0)} KB)`);
}
console.log(`완료 — 총 ${(total / 1024).toFixed(0)} KB — ${OUT}`);
