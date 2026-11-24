// render.mjs — draws the news-image-20261123 front page as a 1024x1024 PNG.
// Node 22, standard library only (node:zlib, node:fs). No network, no fonts
// downloaded: every letter is drawn from a 5x7 bitmap font defined below,
// and the confidence marks are drawn as circles. Fully deterministic.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const W = 1024;
const H = 1024;

// ---- palette: a newspaper front page -------------------------------------
const PAPER = [248, 244, 232]; // warm off-white
const INK = [20, 20, 20]; // near-black
const RED = [158, 27, 27]; // headline red
const GREY = [90, 84, 74]; // source grey
const RULE = [200, 192, 172]; // light rule
const LEAD_BG = [242, 234, 218]; // lead panel tint
const FOOT_BG = [24, 24, 24]; // figures band
const FOOT_INK = [245, 242, 232];
const GOLD = [232, 196, 90]; // figures accent

// ---- 5x7 bitmap font (own hand-drawn patterns, uppercase only) -----------
// Each glyph: 7 rows of 5 bits, '1' = ink. Only the characters the page
// needs are defined; everything is set in capitals on purpose.
const GLYPHS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11100', '10010', '10001', '10001', '10001', '10010', '11100'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '*': ['00000', '10101', '01110', '10101', '00000', '00000', '00000'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'],
  '>': ['01000', '00100', '00010', '00001', '00010', '00100', '01000'],
  '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'],
  // middle dot, used as a separator
  '·': ['00000', '00000', '01100', '01100', '00000', '00000', '00000'],
};

// ---- pixel buffer ---------------------------------------------------------
const px = Buffer.alloc(W * H * 3);
function fillRect(x, y, w, h, c) {
  const x0 = Math.max(0, x), y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w), y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const o = (yy * W + xx) * 3;
      px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
    }
  }
}
function setPx(x, y, c) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const o = (y * W + x) * 3;
  px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
}
function drawGlyph(ch, x, y, s, c) {
  const g = GLYPHS[ch] ?? GLYPHS['?'];
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === '1') fillRect(x + col * s, y + r * s, s, s, c);
    }
  }
}
const CHAR_W = (s) => (s === 1 ? 6 : 5 * s + 1); // glyph + 1px gap (scale 1 keeps a full unit)
function textWidth(t, s) { return t.length * CHAR_W(s) - s; }
function drawText(t, x, y, s, c) {
  let cx = x;
  for (const ch of t) {
    const up = ch === '·' ? '·' : ch.toUpperCase();
    drawGlyph(up, cx, y, s, c);
    cx += CHAR_W(s);
  }
  return cx;
}
// Wrap text to lines of at most maxW pixels at scale s; the first line may
// be narrower (firstMax) when a number prefix sits in front of it.
function wrap(t, maxW, s, firstMax = null) {
  const words = t.split(' ');
  const lines = [];
  let cur = '';
  let limit = firstMax ?? maxW;
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w;
    if (textWidth(trial, s) <= limit || !cur) {
      cur = trial;
    } else {
      lines.push(cur);
      cur = w;
      limit = maxW;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
// Confidence mark: filled circle (high), half-filled (medium), ring (low).
function drawMark(kind, cx, cy, r, c) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 > r * r) continue;
      if (kind === 'high') setPx(cx + dx, cy + dy, c);
      else if (kind === 'low') { if (d2 > (r - 1.5) * (r - 1.5)) setPx(cx + dx, cy + dy, c); }
      else { // medium: left half filled, right half ring
        if (dx <= 0) setPx(cx + dx, cy + dy, c);
        else if (d2 > (r - 1.5) * (r - 1.5)) setPx(cx + dx, cy + dy, c);
      }
    }
  }
}

// ---- the day's stories (exactly the slate's 50, headlines trimmed) -------
// conf: 'high' | 'med' | 'low'. Headlines are the slate's wording, shortened
// to fit the column; nothing is invented, no story from another day is added.
const LEAD = [
  {
    n: 1, tag: 'COP31 · TURKEY',
    head: 'COP31 ENDS WITH NO DEAL AFTER RECORD-LONG TALKS',
    sub: 'SUMMIT COLLAPSES OVER FOSSIL-FUEL PHASE-OUT, FINANCE',
    src: 'PRINCIPIA', conf: 'high',
  },
  {
    n: 2, tag: 'UKRAINE · LIBYA',
    head: 'UKRAINE SINKS RUSSIAN CORVETTE OFF LIBYA',
    sub: 'NAVAL DRONES HIT THE MERKURY AT BENGHAZI; ZELENSKY CONFIRMS',
    src: 'DAILY SUMMARY', conf: 'high',
  },
];
const SECTIONS = [
  { title: 'UKRAINE & EUROPE', stories: [
    { n: 3, head: 'RUSSIAN STRIKES KILL AT LEAST 15 AROUND KYIV', src: 'PRINCIPIA', conf: 'high' },
    { n: 4, head: 'EU PLANS RUSSIA SANCTIONS', src: 'DAILY SUMMARY', conf: 'high' },
    { n: 5, head: 'FINLAND SUMMONS RUSSIAN AMBASSADOR', src: 'DAILY SUMMARY', conf: 'med' },
    { n: 6, head: 'SUSPECTED RUSSIAN DRONE ENTERS POLISH AIRSPACE', src: 'THE BRIEF', conf: 'med' },
    { n: 7, head: 'NATO HOLDS EMERGENCY MEETING ON POLAND', src: 'DAILY NEWS', conf: 'med' },
    { n: 8, head: 'EURO AREA INFLATION RISES TO 4.0%', src: 'PRINCIPIA', conf: 'high' },
    { n: 9, head: 'HUNGARY PM VISITS TRANSCARPATHIA', src: 'DAILY SUMMARY', conf: 'med' },
  ]},
  { title: 'THE IRAN WAR', stories: [
    { n: 10, head: 'US PLANS NEW IRAN SANCTIONS', src: 'DAILY SUMMARY', conf: 'high' },
    { n: 11, head: "TRUMP: IRAN'S HEAVIEST MISSILE WEEK IN OVER A YEAR", src: 'DAILY NEWS', conf: 'med' },
    { n: 12, head: "IRAN VOWS 'EVERY MEANS' TO COUNTER US HORMUZ BLOCKADE", src: 'DAILY SUMMARY', conf: 'high' },
    { n: 13, head: 'VANCE MEETS QATARI LEADERS ON STALLED IRAN TALKS', src: 'BREITBART', conf: 'med' },
    { n: 14, head: 'IRAN FLOGS SINGER PARASTOO AHMADI - 74 LASHES', src: 'BREITBART', conf: 'high' },
    { n: 15, head: 'ISRAELI STRIKE ON A GAZA TRUCK KILLS THREE', src: 'DAILY NEWS', conf: 'med' },
    { n: 16, head: "OPPOSITION CALLS SETTLER ATTACKS 'JEWISH TERRORISM'", src: 'PRINCIPIA', conf: 'high' },
  ]},
  { title: 'MARKETS & MONEY', stories: [
    { n: 17, head: "WALL STREET'S BEST DAY IN 19 MONTHS", src: 'INVESTOPEDIA', conf: 'high' },
    { n: 18, head: 'NVIDIA +31% AS JENSEN HUANG RETURNS AS CEO', src: 'INVESTOPEDIA', conf: 'high' },
    { n: 19, head: 'BITCOIN FALLS TO $55,100, LOWEST SINCE SEPT 2024', src: 'DAILY NEWS', conf: 'med' },
    { n: 20, head: 'GOLD BOUNCES TO $3,635; OIL SLIDES TO $80.25', src: 'INVESTOPEDIA', conf: 'high' },
    { n: 21, head: 'ASIAN TECH SHARES FALL AS AI SELL-OFF DEEPENS', src: 'PRINCIPIA', conf: 'med' },
    { n: 22, head: 'CROWDSTRIKE TO BUY ZSCALER IN A $43.9BN DEAL', src: 'FOOL', conf: 'med' },
  ]},
  { title: 'ASIA-PACIFIC', stories: [
    { n: 23, head: 'FIRE AT INDONESIAN SWEETS FACTORY KILLS AT LEAST 24', src: 'PRINCIPIA', conf: 'high' },
    { n: 24, head: 'INDIA OFFERS EUR 1.4BN FOR NEPAL FLOOD REBUILD', src: 'DAILY SUMMARY', conf: 'high' },
    { n: 25, head: 'BEPICOLOMBO REACHES MERCURY AFTER 8-YEAR TRIP', src: 'PRINCIPIA', conf: 'high' },
    { n: 26, head: 'CHINA: 5,000 DRONES LIGHT UP SKY OVER THREE GORGES', src: 'EURONEWS', conf: 'med' },
    { n: 27, head: 'BANGLADESH VACCINATES 50M CHILDREN AGAINST TYPHOID', src: 'ACCESS24', conf: 'med' },
    { n: 28, head: "PAKISTAN PILOT ZEESHAN ALI SET FOR CHINA'S TIANGONG", src: 'THE BRIEF', conf: 'med' },
  ]},
  { title: 'AFRICA', stories: [
    { n: 29, head: 'DRONE STRIKES HIT HOMES AND A UN BUILDING IN KHARTOUM', src: 'PRINCIPIA', conf: 'high' },
    { n: 30, head: 'TINUBU: VILLA HIT BY WATER AND POWER CUTS', src: 'DAILY SUMMARY', conf: 'med' },
    { n: 31, head: "FIFA: NIGERIA 'NOT READY' TO HOST A WORLD CUP", src: 'APO', conf: 'med' },
    { n: 32, head: 'EAST AFRICAN COMMUNITY MINISTERS MEET IN KAMPALA', src: 'APO', conf: 'med' },
  ]},
  { title: 'AMERICAS', stories: [
    { n: 33, head: 'DEMOCRATS REACH 258 HOUSE SEATS, MOST SINCE 1992', src: 'DAILY NEWS', conf: 'med' },
    { n: 34, head: 'AMTRAK DERAILS HITTING TRACTOR-TRAILER IN LOUISIANA', src: 'DAILY SUMMARY', conf: 'med' },
    { n: 35, head: 'MEXICO CAPTURES DRUG LORD CHAPO ISIDRO', src: 'DAILY SUMMARY', conf: 'med' },
    { n: 36, head: 'DRONES HIT COLOMBIAN POLICE BASE, 60 HOMES DAMAGED', src: 'DAILY SUMMARY', conf: 'high' },
    { n: 37, head: 'SEVERE FLOODING HITS GALAPAGOS AMID EL NINO FEARS', src: 'EURONEWS', conf: 'med' },
    { n: 38, head: 'TRUMP: SPOKE TO NVIDIA BOARD BEFORE HUANG RETURN', src: 'EURONEWS', conf: 'med' },
  ]},
  { title: 'TECH & SCIENCE', stories: [
    { n: 39, head: 'ANTHROPIC SAYS AI HELPED PROVE THE RIEMANN HYPOTHESIS', src: 'PRINCIPIA', conf: 'low' },
    { n: 40, head: 'OPENAI PROPOSES SHARED AI SAFETY LIMITS', src: 'DAILY NEWS', conf: 'med' },
    { n: 41, head: 'US TRACKED ALLEGED HUANG-CHINA SPY CONTACTS', src: 'PRINCIPIA', conf: 'med' },
    { n: 42, head: 'NHS TRIALS AI IN BREAST CANCER SCREENING', src: 'PRINCIPIA', conf: 'high' },
    { n: 43, head: 'US ARMY TO DETONATE TOXIC LEAD EXPLOSIVES IN IOWA', src: 'THE BRIEF', conf: 'med' },
  ]},
  { title: 'SPORT', stories: [
    { n: 44, head: "LIVERPOOL 4-0 MAN UTD IN POCHETTINO'S DEBUT", src: 'SPORTIPLAY', conf: 'high' },
    { n: 45, head: 'INDIA-NZ TEST DRAWN; INDIA DECLARED RECORD 720/9', src: 'APEX', conf: 'high' },
    { n: 46, head: 'HEAT BEAT THUNDER 123-113 FOR 7TH STRAIGHT WIN', src: 'APEX', conf: 'high' },
    { n: 47, head: "BRENTFORD 4-0 EVERTON ON MOYES' RECORD 593RD GAME", src: 'APEX', conf: 'med' },
    { n: 48, head: 'SRI LANKA A BEAT BANGLADESH A BY 7 WICKETS', src: 'SL CRICKET', conf: 'med' },
  ]},
  { title: 'WORLD IN BRIEF', stories: [
    { n: 49, head: 'UN FOOD AGENCY: TRADE CHAOS THREATENS AID FOR 7.3M', src: 'THE BRIEF', conf: 'med' },
    { n: 50, head: 'N. KOREA LEADER STRESSES SECURITY AFTER TRUMP NO-SHOW', src: 'EURONEWS', conf: 'med' },
  ]},
];
const FIGURES = 'NVIDIA +31% · +$950BN IN A DAY · S&P 500 +4.7% · NASDAQ +6.5% · DOW +1,450 · BITCOIN $55,100 TO $61,000 · GOLD $3,635 · OIL $80.25 · EURO INFLATION 4.0% · 15 KILLED NEAR KYIV · 24 DEAD IN INDONESIA FIRE · 74 LASHES · 258 HOUSE SEATS · 5,000 DRONES · 50M CHILDREN VACCINATED · 7.3M PEOPLE AT RISK · 60 HOMES DAMAGED';

// ---- layout ---------------------------------------------------------------
const MARGIN = 16;
const GRID_TOP = 218; // below masthead, legend and lead panel
const GRID_BOTTOM = 910; // figures band starts below
const COLS = 3;
const GUTTER = 12;
const COL_W = Math.floor((W - 2 * MARGIN - (COLS - 1) * GUTTER) / COLS); // 322
const HEAD_LH = 15; // headline line height at scale 2
const SRC_LH = 8; // fallback source line height (scale-1 source tag)
const STORY_GAP = 3;
const SEC_HEAD_H = 18;

// A story's block: headline lines (number prefix on the first line) with the
// source tag + confidence mark appended to the last line when it fits, else
// on its own line. Returns the lines plus whether the source went inline.
function storyLayout(st, colW) {
  const num = String(st.n) + '.';
  const numW = textWidth(num, 2) + 8;
  const lines = wrap(st.head, colW, 2, colW - numW);
  const last = lines[lines.length - 1];
  const lastW = textWidth(last, 2) + (lines.length === 1 ? numW : 0);
  // Source tag is set small (scale 1) so it tucks onto the headline's last
  // line; it goes on its own line only when even that does not fit.
  const srcTag = ' - ' + st.src;
  const inline = lastW + textWidth(srcTag, 1) + 18 <= colW;
  return { lines, num, numW, inline, height: lines.length * HEAD_LH + (inline ? 0 : SRC_LH) + STORY_GAP };
}
function sectionHeight(sec, colW) {
  let h = SEC_HEAD_H;
  for (const st of sec.stories) h += storyLayout(st, colW).height;
  return h;
}

// Flow sections across columns in order; a section may split at a story
// boundary when it does not fit the remaining space of a column.
function planColumns() {
  const cols = [[], [], []];
  let ci = 0, used = 0;
  const avail = GRID_BOTTOM - GRID_TOP;
  for (const sec of SECTIONS) {
    let remaining = [...sec.stories];
    let firstChunk = true;
    while (remaining.length > 0) {
      const room = avail - used;
      if (SEC_HEAD_H + storyLayout(remaining[0], COL_W).height > room) {
        if (ci >= COLS - 1) throw new Error('layout overflow: ran out of columns');
        ci++; used = 0;
        continue;
      }
      const chunk = { title: firstChunk ? sec.title : sec.title + ' (CONT.)', stories: [] };
      let h = SEC_HEAD_H;
      while (remaining.length > 0 && h + storyLayout(remaining[0], COL_W).height <= avail - used) {
        h += storyLayout(remaining[0], COL_W).height;
        chunk.stories.push(remaining.shift());
      }
      cols[ci].push(chunk);
      used += h;
      firstChunk = false;
      if (remaining.length > 0) { ci++; used = 0; if (ci >= COLS) throw new Error('layout overflow: ran out of columns'); }
    }
  }
  return cols;
}

// ---- drawing ---------------------------------------------------------------
fillRect(0, 0, W, H, PAPER);

// Masthead: nameplate, date, strapline.
fillRect(0, 0, W, 4, RED);
const mast = 'THE WORLD TODAY';
drawText(mast, Math.floor((W - textWidth(mast, 5)) / 2), 8, 5, INK);
const dateLine = 'MONDAY 23 NOVEMBER 2026';
drawText(dateLine, Math.floor((W - textWidth(dateLine, 3)) / 2), 50, 3, RED);
fillRect(MARGIN, 78, W - 2 * MARGIN, 2, INK);
const strapL = '50 SOURCED STORIES · 11 SECTIONS';
const strapR = 'WORLD NEWS IN ONE IMAGE';
drawText(strapL, MARGIN, 84, 2, GREY);
drawText(strapR, W - MARGIN - textWidth(strapR, 2), 84, 2, GREY);

// Legend line for the confidence marks.
let lx = MARGIN;
const legendY = 102;
const legendParts = [
  ['high', 'HIGH: 2+ OUTLETS AGREE'],
  ['med', 'MEDIUM: ONE SOLID OUTLET'],
  ['low', 'LOW: THIN OR CONTESTED'],
];
for (const [kind, label] of legendParts) {
  drawMark(kind, lx + 5, legendY + 6, 5, RED);
  lx += 14;
  lx = drawText(label, lx, legendY, 2, GREY) + 18;
}
fillRect(MARGIN, 120, W - 2 * MARGIN, 1, RULE);

// Lead panel: COP31 big on the left, corvette on the right. Each story's
// source and confidence mark sit on its kicker row, right-aligned.
const LEAD_TOP = 126, LEAD_H = 88;
fillRect(MARGIN, LEAD_TOP, W - 2 * MARGIN, LEAD_H, LEAD_BG);
fillRect(MARGIN, LEAD_TOP, W - 2 * MARGIN, 2, RED);
const lead1 = LEAD[0];
drawText('THE LEAD', MARGIN + 8, LEAD_TOP + 7, 2, RED);
{
  const tag = ' - ' + lead1.src;
  const tx = 620 - textWidth(tag, 2) - 18;
  drawText(tag, tx, LEAD_TOP + 7, 2, GREY);
  drawMark(lead1.conf, tx + textWidth(tag, 2) + 10, LEAD_TOP + 13, 5, RED);
}
const lead1Lines = wrap(lead1.head, 596, 3);
lead1Lines.forEach((ln, i) => drawText(ln, MARGIN + 8, LEAD_TOP + 23 + i * 22, 3, INK));
const subLines = wrap(lead1.sub, 596, 2);
subLines.forEach((ln, i) => drawText(ln, MARGIN + 8, LEAD_TOP + 23 + lead1Lines.length * 22 + i * 15, 2, GREY));
// divider + second lead story
const DIV_X = 620;
fillRect(DIV_X, LEAD_TOP + 8, 1, LEAD_H - 16, RULE);
const lead2 = LEAD[1];
drawText(lead2.tag, DIV_X + 10, LEAD_TOP + 7, 2, RED);
{
  const tag = ' - ' + lead2.src;
  const tx = W - MARGIN - textWidth(tag, 2) - 18;
  drawText(tag, tx, LEAD_TOP + 7, 2, GREY);
  drawMark(lead2.conf, tx + textWidth(tag, 2) + 10, LEAD_TOP + 13, 5, RED);
}
const lead2Lines = wrap(lead2.head, W - MARGIN - 8 - (DIV_X + 10), 2);
lead2Lines.forEach((ln, i) => drawText(ln, DIV_X + 10, LEAD_TOP + 25 + i * 16, 2, INK));
const l2sub = wrap(lead2.sub, W - MARGIN - 8 - (DIV_X + 10), 2);
l2sub.forEach((ln, i) => drawText(ln, DIV_X + 10, LEAD_TOP + 25 + lead2Lines.length * 16 + i * 15, 2, GREY));

// Grid of sections, three columns.
const cols = planColumns();
cols.forEach((chunks, ci) => {
  const x = MARGIN + ci * (COL_W + GUTTER);
  let y = GRID_TOP;
  for (const chunk of chunks) {
    drawText(chunk.title, x, y, 2, RED);
    fillRect(x, y + 16, COL_W, 2, RED);
    y += SEC_HEAD_H;
    for (const st of chunk.stories) {
      const lay = storyLayout(st, COL_W);
      drawText(lay.num, x, y, 2, RED);
      lay.lines.forEach((ln, i) => {
        const lx2 = i === 0 ? x + lay.numW : x;
        drawText(ln, lx2, y + i * HEAD_LH, 2, INK);
      });
      const lastY = y + (lay.lines.length - 1) * HEAD_LH;
      const last = lay.lines[lay.lines.length - 1];
      if (lay.inline) {
        // Small grey source, bottom-aligned with the headline glyphs.
        const baseW = textWidth(last, 2) + (lay.lines.length === 1 ? lay.numW : 0);
        let cx2 = drawText(' - ' + st.src, x + baseW, lastY + 7, 1, GREY);
        drawMark(st.conf, cx2 + 10, lastY + 7, 5, RED);
      } else {
        // Own line, small grey source tag with a smaller mark.
        let cx2 = drawText(st.src, x, lastY + HEAD_LH, 1, GREY);
        drawMark(st.conf, cx2 + 10, lastY + HEAD_LH + 3, 4, RED);
      }
      y += lay.height;
    }
  }
});

// Figures band at the foot.
fillRect(0, GRID_BOTTOM + 6, W, H - GRID_BOTTOM - 6, FOOT_BG);
const figY = GRID_BOTTOM + 16;
drawText('BY THE NUMBERS', MARGIN, figY, 2, GOLD);
const figLines = wrap(FIGURES, W - 2 * MARGIN, 2);
figLines.forEach((ln, i) => drawText(ln, MARGIN, figY + 20 + i * 16, 2, FOOT_INK));
const footY = figY + 20 + figLines.length * 16 + 6;
drawText('ALL 50 STORIES SOURCED AND CONFIDENCE-MARKED ABOVE · MONDAY 23 NOVEMBER 2026',
  MARGIN, footY, 1, [150, 148, 140]);

// ---- PNG encode (filter 0 scanlines, zlib deflate, CRC32) ------------------
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0; // filter: none
  px.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type RGB
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync(new URL('./entry.png', import.meta.url), png);

// Layout report on stderr so the build log shows the fit.
const heights = cols.map((chunks) => chunks.reduce((s, c) => s + SEC_HEAD_H + c.stories.reduce((a, st) => a + storyLayout(st, COL_W).height, 0), 0));
console.error(`columns: ${heights.join(', ')} / ${GRID_BOTTOM - GRID_TOP} available; fig lines: ${figLines.length}; footY: ${footY}; png bytes: ${png.length}`);
