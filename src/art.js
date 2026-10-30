// 모든 그림은 직접 그린 SVG다. 외부 이미지·폰트 요청이 없다.
(function (root) {
  'use strict';

  // ---------- 아이콘 (24×24 선 그림) ----------
  const P = {
    book: '<path d="M12 6.5Q7.5 3 2.5 4.5v14Q7.5 17 12 20.5q4.5-3.5 9.5-2v-14Q16.5 3 12 6.5Z"/><path d="M12 6.5v14"/>',
    palette: '<path d="M12 3C6.5 3 3 7 3 11.5S6.5 21 11 21c2.5 0 2.6-2.4 1.6-3.4S12.4 15 14.5 15H17c5 0 4.6-12-5-12Z"/><circle cx="7.5" cy="10" r="1.2"/><circle cx="11.5" cy="7" r="1.2"/><circle cx="16" cy="9" r="1.2"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12C12 7 8.5 5 4 5c0 4.5 3 7 8 7Z"/><path d="M12 10c0-4 3-6.5 8-6.5 0 4.5-3 6.5-8 6.5Z"/>',
    cap: '<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5"/><path d="M22 9v6"/>',
    letter: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    heart: '<path d="M12 20.5C6 16 3 12.6 3 9.2 3 6.4 5.2 4.5 7.6 4.5c1.8 0 3.3 1 4.4 2.6 1.1-1.6 2.6-2.6 4.4-2.6 2.4 0 4.6 1.9 4.6 4.7 0 3.4-3 6.8-9 11.3Z"/>',
    scroll: '<path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8"/><path d="M7 4a2 2 0 0 0-2 2v2h4"/><path d="M9 6v12a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-1h4"/><path d="M12 9h4M12 13h4"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V4.5h6V7"/><path d="M3 12.5h18"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 8.5 1.6 7 1.9-5 1.9 5 1.6-7"/><path d="M8 12h8"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    ring: '<circle cx="12" cy="15" r="6"/><path d="m9.5 6 2.5-3 2.5 3-2.5 3Z"/>',
    baby: '<circle cx="12" cy="7" r="3.5"/><path d="M6 20c0-5 2.5-8.5 6-8.5s6 3.5 6 8.5Z"/><path d="M10 16h4"/>',
    suitcase: '<rect x="3.5" y="8" width="17" height="12" rx="2"/><path d="M9 8V5h6v3M8 8v12M16 8v12"/>',
    house: '<path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
    chart: '<path d="M4 20h16"/><path d="m5 16 4.5-5 3 3L18 7.5"/><path d="M14.5 7.5H18V11"/>',
    chartdown: '<path d="M4 20h16"/><path d="m5 7.5 4.5 5 3-3L18 15"/><path d="M14.5 15H18v-3.5"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    family: '<circle cx="7" cy="6" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="12" cy="11.5" r="2"/><path d="M3 20v-4.5a4 4 0 0 1 7-2.6M21 20v-4.5a4 4 0 0 0-7-2.6M9.5 20v-2a2.5 2.5 0 0 1 5 0v2"/>',
    piggy: '<path d="M4 12.5c0-3.8 3.8-6 8-6 2.6 0 4.6.8 5.8 2l2.2-1v3.3c.8 1 .8 2.8 0 3.8l-1 .9V19h-3v-1.8H10V19H7v-2.7C5 15.4 4 14 4 12.5Z"/><circle cx="15.5" cy="11" r=".9"/><path d="M10 6.5 9 4.5"/>',
    pencil: '<path d="M4 20l1.2-4.8L16 4.4l3.6 3.6L8.8 18.8Z"/><path d="m14 6.5 3.5 3.5"/>',
    hands: '<path d="M2.5 11.5 6 8l3.5 1.5L13 8h3.5l5 4"/><path d="M6 8v6l5 5c.8.8 2 .8 2.8 0l5-5"/><path d="m9.5 14.5 2 2M12 12.5l2 2"/>',
    shield: '<path d="M12 3 19.5 6v6c0 4.8-3.4 7.9-7.5 9-4.1-1.1-7.5-4.2-7.5-9V6Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    flower: '<circle cx="12" cy="8.5" r="2.2"/><path d="M12 6.3c-1-2.5 2-2.5 1 0M14.2 8.5c2.5-1 2.5 2 0 1M12 10.7c1 2.5-2 2.5-1 0M9.8 8.5c-2.5 1-2.5-2 0-1"/><path d="M12 11v10M12 17c-2.2 0-4-1.2-4.5-3.5M12 19c2.2 0 4-1.2 4.5-3.5"/>',
    cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z"/><path d="M16 10.5h1.5a2.3 2.3 0 0 1 0 4.6H16"/><path d="M8.5 3.5c0 1.7 1.5 1.7 1.5 3.4M12.5 3.5c0 1.7 1.5 1.7 1.5 3.4"/>',
    shoe: '<path d="M3 16.5 4 8h4l2.2 3h3.8l6 3.2v3H3Z"/><path d="M3 19.5h18"/>',
    bowl: '<path d="M3 11h18a9 8 0 0 1-18 0Z"/><path d="M8.5 7.5c1-1.8 2.5-1.8 3.2-4M13.5 7.5c1-1.8 2.5-1.8 3.2-4"/>',
    flask: '<path d="M9 3h6M10 3v6l-5.2 9a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 9V3"/><path d="M7.2 15h9.6"/>',
    pen: '<path d="m14.5 4.5 5 5L8.5 20.5H3.5v-5Z"/><path d="m12.5 6.5 5 5"/>',
    pill: '<path d="M10.6 19.9a5 5 0 0 1-7-7l6.8-6.8a5 5 0 0 1 7 7Z"/><path d="m7 9.5 7 7"/>',
    ball: '<circle cx="12" cy="12" r="8.5"/><path d="m12 8 3.3 2.4-1.3 3.9h-4l-1.3-3.9Z"/><path d="M12 8V3.6M15.3 10.4l4.2-1.3M14 14.3l2.6 3.6M10 14.3l-2.6 3.6M8.7 10.4 4.5 9.1"/>',
    growth: '<path d="M3 20h5v-5h5v-5h5V5h3"/><path d="M15 5h6v6" opacity=".0"/>',
    joy: '<circle cx="12" cy="12" r="8.5"/><path d="M8 13.5c2 3 6 3 8 0"/><path d="M9 9.2h.01M15 9.2h.01" stroke-width="2.6"/>',
    calm: '<path d="M4.5 19.5C1 9 9 3.5 20.5 3.5c0 11.5-5 17.5-16 16Z"/><path d="M4.5 19.5 15 9"/>',
    bond: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="8.5" r="2.6"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M13 20a4.8 4.8 0 0 1 9 -1"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    back: '<path d="M9 7 4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-2"/>',
    replay: '<path d="M4 10a8 8 0 1 1 .6 6"/><path d="M4 4v6h6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1 1-1.1 1.8v.6"/><path d="M12 17.2h.01" stroke-width="2.6"/>',
    notes: '<path d="M6 3h9l4 4v14H6Z"/><path d="M15 3v4h4M9 11h7M9 15h7"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    vote: '<path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7.5-6.5 7.5-3 0-4.5-1.8-6-4.5L3.2 12.6a1.5 1.5 0 0 1 2.4-1.7L8 13.5"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" stroke-width="2.8"/>',
    skip: '<path d="m5 6 7 6-7 6ZM13 6l7 6-7 6Z"/>',
    play: '<path d="M7 4.5v15l12-7.5Z"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    guitar: '<path d="M14.5 9.5 20 4"/><path d="m18 2 4 4"/><path d="M10.6 9.4a3.5 3.5 0 0 0-5 .6c-.8 1-.9 2.2-2.4 3-1.8 1-1.6 3.6 0 5.3 1.7 1.6 4.3 1.8 5.3 0 .8-1.5 2-1.6 3-2.4a3.5 3.5 0 0 0 .6-5Z"/><circle cx="8.5" cy="15.5" r="1.3"/>',
    medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.5 6 3h4l2 5 2-5h4l-2.5 7.5"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M2.5 9h19M12 9v11M12 9c-1.5-3-5-4-5.5-2S9 9 12 9c3 0 6-1 5.5-3S13.5 6 12 9Z"/>',
    game: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7 10.5v4M5 12.5h4"/><path d="M15.5 11.5h.01M18 13.5h.01" stroke-width="2.6"/>',
    ring: '<circle cx="12" cy="15" r="6"/><path d="m9.5 6 2.5-3 2.5 3-2.5 3Z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  };
  function icon(name, cls = '') {
    return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.star}</svg>`;
  }
  // SVG 안에 넣는 아이콘 (중심 cx,cy / 크기 s)
  function iconAt(name, cx, cy, s, color) {
    return `<g transform="translate(${cx - s / 2} ${cy - s / 2}) scale(${s / 24})" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${P[name] || P.star}</g>`;
  }

  // ---------- 사람 ----------
  const lifeStage = a => a < 13 ? 'child' : a < 20 ? 'teen' : a < 30 ? 'young' : a < 50 ? 'adult' : a < 65 ? 'middle' : 'senior';
  const SCALE = { child: .7, teen: .88, young: .97, adult: 1, middle: .99, senior: .95 };
  const look = (skin, hair, hairstyle, c, extra = {}) => ({ skin, hair, hairstyle, ...extra, child: c[0], teen: c[1], young: c[2], adult: c[3], middle: c[4], senior: c[5] });
  const LOOKS = {
    me: look('#f3c7a0', '#3a2c28', 'short', [['#f5b83d', '#4e6d9e'], ['#2f4f80', '#3a4358'], ['#3c9b90', '#394a60'], ['#5b86c8', '#36435a'], ['#a08757', '#474a55'], ['#ad7383', '#5a5b66']]),
    partner: look('#efc29b', '#5b382c', 'long', [['#ef8f7a', '#59607a'], ['#e07c69', '#4b4f6a'], ['#e07c69', '#4b4f6a'], ['#d9855f', '#4b4f6a'], ['#7f9c6d', '#4e5160'], ['#8c80b4', '#56586a']]),
    partner2: look('#f1c7a4', '#8a5a3c', 'bob', [['#5fa7a0', '#4b4f6a'], ['#5fa7a0', '#4b4f6a'], ['#5fa7a0', '#44506a'], ['#4f9a92', '#44506a'], ['#6e8f86', '#4e5160'], ['#7f8fa8', '#56586a']]),
    partner3: look('#ecbf97', '#2b2324', 'long', [['#c86b8f', '#4b4f6a'], ['#c86b8f', '#4b4f6a'], ['#c86b8f', '#4b4f6a'], ['#b85f83', '#454b63'], ['#a1708a', '#4e5160'], ['#9d84a8', '#56586a']], { clip: '#e0485a' }),
    kid: look('#f5cba6', '#4a3426', 'kid', [['#6fbf73', '#5d6fa3'], ['#f08a5d', '#3f4a66'], ['#6b8fd6', '#3f4a66'], ['#6b8fd6', '#3f4a66'], ['#6b8fd6', '#3f4a66'], ['#6b8fd6', '#3f4a66']]),
    friend1: look('#f1c39a', '#2e2420', 'short', [['#5aa469', '#3d4a5e'], ['#5aa469', '#3d4a5e'], ['#5aa469', '#3d4a5e'], ['#4f8f5e', '#3d4a5e'], ['#7d8f6a', '#4a4d55'], ['#9a8c7a', '#55575f']], { cap: '#d9534f' }),
    friend2: look('#f4cdaa', '#6b4430', 'bob', [['#f2a65a', '#4a4f6a'], ['#f2a65a', '#4a4f6a'], ['#f2a65a', '#4a4f6a'], ['#e0954b', '#4a4f6a'], ['#c9935a', '#4e5160'], ['#b9907a', '#56586a']]),
    friend3: look('#e9b88f', '#3b3030', 'kid', [['#7a8cd6', '#3f4a66'], ['#7a8cd6', '#3f4a66'], ['#7a8cd6', '#3f4a66'], ['#6c7dc4', '#3f4a66'], ['#7b86a8', '#4e5160'], ['#8a8fa8', '#56586a']]),
  };
  const OUTFITS = {
    'jacket-bright': { body: '#e8b74a', arm: '#f6efe0', trim: '#f6efe0' },
    'jacket-navy': { body: '#2c3e66', arm: '#f1ece0', trim: '#f1ece0', emblem: '#e2b04a' },
    apron: { body: '#eef0ea', arm: '#eef0ea', apron: '#c9764f' },
    suit: { body: '#2f3f5c', arm: '#2f3f5c', shirt: '#f7f5ee', tie: '#b84a4a' },
    luxury: { body: '#26292f', arm: '#26292f', shirt: '#ffffff', tie: '#d4a64a', square: '#d4a64a', watch: true },
    knit: { body: '#8cc5b0', arm: '#8cc5b0', knit: true },
  };
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const m = v => Math.max(0, Math.min(255, Math.round(v * f)));
    return '#' + ((1 << 24) | (m(r) << 16) | (m(g) << 8) | m(b)).toString(16).slice(1);
  }
  function hair(L, st) {
    const style = L.hairstyle, gray = st === 'senior' ? '#dedad2' : st === 'middle' ? shade(L.hair, 1.35) : L.hair;
    const top = '<path d="M-25 -120c-4-26 12-38 32-36 18 2 26 14 25 30-8-9-20-12-32-11-10 1-17 6-20 17Z"/>';
    let h;
    if (style === 'long') h = `<path d="M-27 -124c-6 22-3 40 6 46l5-20c-4-8-5-17-4-26Z"/>${top}${st === 'senior' ? '<circle cx="-18" cy="-150" r="9"/>' : ''}${L.clip ? `<circle cx="-14" cy="-146" r="4" fill="${L.clip}"/>` : ''}`;
    else if (style === 'bob') h = `<path d="M-28 -122c-4 14-2 22 3 26l5-12c-2-5-3-10-2-15Z"/>${top}<path d="M27 -128c3 8 2 15-2 19l-3-9Z"/>`;
    else if (style === 'kid') h = '<path d="M-27 -118c-3-28 14-40 33-37 17 3 25 15 24 31-12-6-26-7-40-4-7 2-12 5-17 10Z"/>';
    else h = top;
    const cap = L.cap && st !== 'senior' ? `<path d="M-25 -134c2-24 48-26 53-3Z" fill="${L.cap}"/><path d="M26 -137h22q3 6-6 7H25Z" fill="${shade(L.cap, .8)}"/>` : '';
    return `<g fill="${gray}">${h}</g>${cap}`;
  }
  function face(mood) {
    const eye = mood === 'happy' ? '<path d="M5 -124q4-6 8 0M17 -124q4-6 8 0" stroke="#3b302b" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      : '<circle cx="9" cy="-125" r="3" fill="#3b302b"/><circle cx="21" cy="-125" r="3" fill="#3b302b"/>';
    const brow = mood === 'sad' ? '<path d="M4 -133l8 3M26 -133l-8 3" stroke="#3b302b" stroke-width="2" stroke-linecap="round"/>' : '';
    const mouth = mood === 'happy' ? '<path d="M11 -115q5 8 10 0Z" fill="#a0504a"/>'
      : mood === 'sad' ? '<path d="M12 -110q4-5 8 0" fill="none" stroke="#a0604d" stroke-width="2" stroke-linecap="round"/>'
        : mood === 'neutral' ? '<path d="M12 -112h8" stroke="#a0604d" stroke-width="2" stroke-linecap="round"/>'
          : '<path d="M12 -113q4 3.5 8 0" fill="none" stroke="#a0604d" stroke-width="2" stroke-linecap="round"/>';
    const tear = mood === 'sad' ? '<path d="M24 -119q-3 5 0 7q3-2 0-7Z" fill="#8fc3e8"/>' : '';
    return `${eye}${brow}<ellipse cx="5" cy="-115" rx="4.5" ry="2.6" fill="#f08f8f" opacity=".45"/><ellipse cx="25" cy="-115" rx="3.5" ry="2.4" fill="#f08f8f" opacity=".45"/>${mouth}${tear}`;
  }
  // 손에 드는 물건 (앞팔 안에 그려 팔과 함께 흔들린다). 손 위치 (0,-60).
  const HOLD = {
    flowers: '<g transform="translate(9 -66)"><path d="M-6 2h12L1 24Z" fill="#f3e3c3" stroke="#e0cfa6" stroke-width="1.5"/><path d="M-2 2-6-6M1 2v-10M4 2l5-7" stroke="#5f9a58" stroke-width="2"/><circle cx="-7" cy="-8" r="5" fill="#f2a7b5"/><circle cx="1" cy="-12" r="5.5" fill="#ffffff"/><circle cx="9" cy="-8" r="5" fill="#f7c5cc"/><circle cx="-1" cy="-4" r="4" fill="#ffe08a"/></g>',
    certificate: '<g transform="translate(-2 -66)"><rect x="0" y="0" width="30" height="10" rx="5" fill="#fff6dc" stroke="#d9c79a" stroke-width="1.5"/><rect x="12" y="-1" width="6" height="12" fill="#d9534f"/><path d="M14 11l-3 7M16 11l3 7" stroke="#d9534f" stroke-width="2.5"/></g>',
    ball: '<g transform="translate(9 -50)"><circle r="10" fill="#fff" stroke="#4a4a4a" stroke-width="1.5"/><path d="m0-4 4 3-1.5 4.5h-5L-4-1Z" fill="#4a4a4a"/></g>',
    laptop: '<g transform="translate(-4 -70)"><rect width="28" height="19" rx="2" fill="#9aa3ad" stroke="#6f7781" stroke-width="1.5"/><circle cx="14" cy="9.5" r="2.5" fill="#dfe3e7"/></g>',
    books: '<g transform="translate(-2 -68)"><rect width="24" height="7" rx="1.5" fill="#4f78b8"/><rect x="2" y="7" width="22" height="7" rx="1.5" fill="#e39a12"/><rect x="-1" y="14" width="25" height="7" rx="1.5" fill="#22977a"/></g>',
    piggy: '<g transform="translate(10 -56)"><ellipse rx="12" ry="9" fill="#f4a9b8"/><circle cx="11" cy="-1" r="4" fill="#f08fa2"/><path d="M-2-9l2-5 3 4" fill="#f08fa2"/><circle cx="5" cy="-3" r="1.3" fill="#5a3a3a"/><path d="M-6 8v3M6 8v3" stroke="#f08fa2" stroke-width="3"/></g>',
    cup: '<g transform="translate(4 -66)"><path d="M0 0h14v12a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5Z" fill="#fff" stroke="#b9a98a" stroke-width="1.5"/><path d="M14 3h3a3 3 0 0 1 0 6h-3" fill="none" stroke="#b9a98a" stroke-width="1.5"/><path d="M4-3q2-3 0-6M9-3q2-3 0-6" stroke="#cfc4ae" stroke-width="1.5" fill="none"/></g>',
    gift: '<g transform="translate(1 -68)"><rect width="22" height="18" rx="2" fill="#e2577a"/><path d="M11 0v18M0 7h22" stroke="#ffe08a" stroke-width="3"/><path d="M11 0c-4-6-9-4-6 0M11 0c4-6 9-4 6 0" stroke="#ffe08a" stroke-width="2.5" fill="none"/></g>',
    briefcase: '<g transform="translate(-6 -56)"><rect width="26" height="17" rx="3" fill="#8a5a3c"/><path d="M9 0v-4h8v4" stroke="#6b4430" stroke-width="2.5" fill="none"/><path d="M0 7h26" stroke="#6b4430" stroke-width="1.5"/></g>',
    boxes: '<g transform="translate(-2 -76)"><rect width="30" height="24" rx="2" fill="#d7b07a" stroke="#b58c58" stroke-width="1.5"/><path d="M0 7h30M15 0v7" stroke="#b58c58" stroke-width="1.5"/></g>',
    pen: '<path d="M2 -58l14 -14" stroke="#3b78d4" stroke-width="4" stroke-linecap="round"/>',
    flask: '<g transform="translate(4 -72)"><path d="M3 0h8M5 0v6L0 16a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3L9 6V0" fill="#dff1ea" stroke="#22977a" stroke-width="1.5"/><path d="M1 13h12l1 3a2 2 0 0 1-2 3H2a2 2 0 0 1-2-3Z" fill="#22977a"/></g>',
    game: '<g transform="translate(-4 -66)"><rect width="30" height="17" rx="8.5" fill="#4f5b8a"/><path d="M7 5v7M3.5 8.5h7" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="21" cy="6" r="2.2" fill="#ef6a4c"/><circle cx="24.5" cy="10.5" r="2.2" fill="#ffe08a"/></g>',
    suitcase: '<g transform="translate(-2 -64)"><path d="M4 -6v-10h12v10" stroke="#5b6470" stroke-width="2.5" fill="none"/><rect x="-2" y="-6" width="24" height="34" rx="4" fill="#3f8fd0"/><path d="M4 -6v34M16 -6v34" stroke="#2f6ea6" stroke-width="2"/><circle cx="2" cy="31" r="3" fill="#3a3a3a"/><circle cx="18" cy="31" r="3" fill="#3a3a3a"/></g>',
    ring: '<g transform="translate(-1 -70)"><path d="M0 8h22v12a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3Z" fill="#b8323c"/><path d="M0 8 2 0h18l2 8Z" fill="#d24a55"/><path d="M2 8h18" stroke="#8f2730" stroke-width="1.5"/><circle cx="11" cy="9" r="5.5" fill="none" stroke="#e6b94a" stroke-width="2.6"/><path d="m8.5 2.5 2.5-3 2.5 3-2.5 2.6Z" fill="#dff3ff" stroke="#9fd0ea" stroke-width="1"/></g>',
    bowl: '<g transform="translate(-2 -62)"><path d="M0 0h26a13 11 0 0 1-26 0Z" fill="#fff" stroke="#b9a98a" stroke-width="1.5"/><path d="M5 0q4-6 8 0q4-6 8 0" fill="#9fcd88"/></g>',
  };
  function held(name) { return name ? (HOLD[name] || `<g transform="translate(10 -62)"><circle r="12" fill="#fff" stroke="#c9bfae" stroke-width="1.5"/>${iconAt(name, 0, 0, 16, '#6b6252')}</g>`) : ''; }
  // look: me|partner|partner2|partner3|kid|friend1~3. 발끝 (0,0) 기준, 오른쪽을 보고 걷는다.
  // opts: { wear: [glasses, bandage, beret, strawhat, lanyard, camera, guitar, headband], outfit, hold, mood, baby }
  function person(lookName, age, opts = {}) {
    const L = LOOKS[lookName] || LOOKS.me, st = lifeStage(age), [baseTop, pants] = L[st];
    const wear = new Set(opts.wear || []), O = st !== 'senior' && st !== 'child' ? OUTFITS[opts.outfit] : null;
    const top = O ? O.body : baseTop, armTop = O ? O.arm : baseTop;
    const s = SCALE[st] * (opts.scale || 1);
    const skin = L.skin, legBack = shade(pants, .8), armBack = shade(armTop, .82);
    const leg = (cls, col) => `<g class="leg ${cls}"><path d="M-6.5 -50h13v42a6.5 6.5 0 0 1-13 0Z" fill="${col}"/><ellipse cx="4" cy="-4" rx="10" ry="5.5" fill="#2e2b2a"/></g>`;
    const arm = (cls, col, extra = '') => `<g class="arm ${cls}${cls === 'a1' && opts.reach ? ' reach' : ''}"><path d="M-5.5 -92h11v30a5.5 5.5 0 0 1-11 0Z" fill="${col}"/><circle cx="0" cy="-60" r="6.5" fill="${skin}"/>${extra}</g>`;
    const body = `<path d="M-21 -99h42v42a10 10 0 0 1-10 10h-22a10 10 0 0 1-10-10Z" fill="${top}"/>`;
    let torso;
    if (O) {
      torso = body;
      if (O.trim) torso += `<path d="M-21 -54h42v-4h-42Z" fill="${O.trim}"/><path d="M-8 -99 0 -90 8 -99Z" fill="${O.trim}"/>`;
      if (O.emblem) torso += `<circle cx="11" cy="-82" r="5" fill="${O.emblem}"/>`;
      if (O.apron) torso += `<path d="M-14 -90h28l3 43h-34Z" fill="${O.apron}"/><path d="M-10 -90 0 -99 10 -90" stroke="${O.apron}" stroke-width="3" fill="none"/><rect x="-7" y="-72" width="14" height="9" rx="2" fill="${shade(O.apron, .85)}"/>`;
      if (O.shirt) torso += `<path d="M-8 -99 0 -78 8 -99Z" fill="${O.shirt}"/><path d="M-2 -90h4l2 16-4 4-4-4Z" fill="${O.tie}"/>`;
      if (O.square) torso += `<path d="M9 -84h8l-1 4h-6Z" fill="${O.square}"/>`;
      if (O.knit) torso += `<path d="M-19 -86h38M-19 -76h38M-19 -66h38" stroke="${shade(O.body, 1.12)}" stroke-width="2.5"/>`;
    } else if (st === 'teen') torso = `${body}<path d="M-7 -99 0 -82 7 -99Z" fill="#f4f1e8"/><path d="M-2 -88h4l2 14-4 4-4-4Z" fill="#c2514d"/>`;
    else if (st === 'middle') torso = `${body}<path d="M-6 -99h12v52h-12Z" fill="#f1ead8"/><circle cx="9" cy="-80" r="1.6" fill="#6b5a3c"/><circle cx="9" cy="-68" r="1.6" fill="#6b5a3c"/>`;
    else torso = `${body}${st === 'young' ? `<path d="M-14 -99c4 8 24 8 28 0" fill="none" stroke="${shade(top, .8)}" stroke-width="4"/>` : ''}`;
    const backpack = st === 'child' && lookName !== 'partner' ? `<rect x="-33" y="-96" width="15" height="34" rx="6" fill="#e2725b"/><path d="M-18 -94c6 6 8 16 6 26" stroke="#c75a45" stroke-width="3" fill="none"/>` : '';
    const guitar = wear.has('guitar') ? `<g transform="rotate(-28 -20 -72)"><rect x="-23" y="-150" width="6" height="62" rx="2" fill="#6b4a30"/><rect x="-25" y="-156" width="10" height="10" rx="2" fill="#3e2c1f"/><path d="M-20 -96c-14 0-18 10-14 18-8 4-8 18 2 22 8 3 16 3 24 0 10-4 10-18 2-22 4-8 0-18-14-18Z" fill="#c9763d"/><circle cx="-20" cy="-74" r="4" fill="#3e2c1f"/></g>` : '';
    const glasses = st === 'senior' || wear.has('glasses') ? `<g fill="none" stroke="#6b6f6b" stroke-width="1.8"><circle cx="9" cy="-125" r="6"/><circle cx="22" cy="-125" r="6"/><path d="M15 -125h1M-3 -127l6 1"/></g>` : '';
    const bandage = wear.has('bandage') ? '<g transform="rotate(-20 24 -112)"><rect x="17" y="-115" width="14" height="6" rx="3" fill="#f3d8a8"/><circle cx="22" cy="-112" r=".9" fill="#c9a874"/><circle cx="26" cy="-112" r=".9" fill="#c9a874"/></g>' : '';
    const beret = wear.has('beret') && st !== 'senior' ? '<ellipse cx="0" cy="-151" rx="27" ry="9" fill="#9b2f3b"/><circle cx="2" cy="-160" r="3" fill="#9b2f3b"/>' : '';
    const strawhat = wear.has('strawhat') ? '<ellipse cx="3" cy="-146" rx="42" ry="8" fill="#e7c77a"/><path d="M-20 -147c0-22 46-22 46 0Z" fill="#edd38f"/><path d="M-20 -149h46" stroke="#b5894a" stroke-width="4"/>' : '';
    const headband = wear.has('headband') ? '<path d="M-25 -141c14-8 38-8 52 0" stroke="#e2577a" stroke-width="6" fill="none" stroke-linecap="round"/>' : '';
    const lanyard = wear.has('lanyard') ? '<path d="M-6 -99 4 -80 12 -99" stroke="#3b78d4" stroke-width="2.5" fill="none"/><rect x="-1" y="-80" width="12" height="15" rx="2" fill="#fff" stroke="#3b78d4" stroke-width="1.5"/><rect x="1" y="-78" width="8" height="3" fill="#3b78d4"/>' : '';
    const camera = wear.has('camera') ? '<path d="M-10 -99 6 -78 16 -99" stroke="#3a3a3a" stroke-width="2" fill="none"/><rect x="-2" y="-82" width="20" height="13" rx="3" fill="#2f3237"/><circle cx="8" cy="-75.5" r="4" fill="#8fb6d9" stroke="#1d1f22" stroke-width="1.5"/>' : '';
    const watch = O && O.watch ? '<rect x="-6.5" y="-70" width="13" height="5" rx="2" fill="#d4a64a"/>' : '';
    const cane = st === 'senior' && lookName === 'me' ? `<path d="M26 -58 30 0" stroke="#8a6447" stroke-width="5" stroke-linecap="round"/><path d="M20 -60q6-6 8 2" stroke="#8a6447" stroke-width="5" fill="none" stroke-linecap="round"/>` : '';
    const baby = opts.baby ? `<g class="baby"><ellipse cx="17" cy="-74" rx="13" ry="11" fill="#fff4dc" stroke="#e8d7b0" stroke-width="2"/><circle cx="22" cy="-86" r="8" fill="${skin}"/><path d="M17 -91c3-4 9-4 11 0" fill="#e8d7b0"/><circle cx="25" cy="-86" r="1.3" fill="#3b302b"/></g>` : '';
    return `<g class="person look-${lookName} st-${st}"><ellipse class="shadow" cx="2" cy="1" rx="${26 * s}" ry="${6 * s}" fill="#2b3a2a" opacity=".16"/>
      <g transform="scale(${s})"><g class="bob">${guitar}${backpack}${leg('l2', legBack)}${arm('a2', armBack)}${leg('l1', pants)}${torso}${lanyard}${camera}<rect x="-6" y="-106" width="12" height="10" rx="4" fill="${skin}"/><circle cx="3" cy="-127" r="28" fill="${skin}"/>${hair(L, st)}${headband}${beret}${strawhat}${face(opts.mood)}${glasses}${bandage}${arm('a1', armTop, watch + held(opts.hold))}${cane}${baby}</g></g></g>`;
  }

  // ---------- 자연 ----------
  function tree(x, y, s = 1, kind = 0, tone = 0) {
    const greens = [['#6dab68', '#5b9a5c'], ['#8dbd6a', '#76a95a'], ['#5f9e76', '#4f8b66'], ['#e8c25a', '#d8ac45']][tone % 4];
    if (kind === 1) return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-5 0h10v-30h-10Z" fill="#8a6a4f"/><path d="M0 -150 38 -60H18l30 -2 -48 -48 -48 48 30 2h-20Z" fill="${greens[1]}"/><path d="M0 -150 26 -96H-26Z" fill="${greens[0]}"/></g>`;
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 0h12v-55h-12Z" fill="#8a6a4f"/><circle cx="0" cy="-92" r="46" fill="${greens[1]}"/><circle cx="-26" cy="-70" r="30" fill="${greens[1]}"/><circle cx="26" cy="-72" r="32" fill="${greens[1]}"/><circle cx="-8" cy="-104" r="34" fill="${greens[0]}"/><circle cx="20" cy="-96" r="22" fill="${greens[0]}" opacity=".9"/></g>`;
  }
  function bush(x, y, s = 1, c = '#79b267') {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="-26" cy="-14" r="20"/><circle cx="0" cy="-24" r="26"/><circle cx="28" cy="-14" r="20"/><rect x="-46" y="-16" width="92" height="16" rx="8"/></g>`;
  }
  function flowers(x, y, seed) {
    const cols = ['#ffffff', '#f7c5cc', '#ffe98a', '#d9c8f2'];
    let out = '';
    for (let k = 0; k < 4; k++) {
      const dx = ((seed * 37 + k * 53) % 70) - 35, dy = ((seed * 17 + k * 29) % 22) - 11, c = cols[(seed + k) % 4];
      out += `<g transform="translate(${x + dx} ${y + dy})"><path d="M0 0v-12" stroke="#5f9a58" stroke-width="2"/><circle cx="0" cy="-14" r="4.5" fill="${c}"/><circle cx="0" cy="-14" r="1.6" fill="#f0b23c"/></g>`;
    }
    return out;
  }
  function grass(x, y) { return `<path d="M${x} ${y}l-4-14m4 14 1-17m-1 17 6-12" stroke="#5e9a55" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; }
  function cloud(x, y, s) { return `<g transform="translate(${x} ${y}) scale(${s})" fill="#fffdf6"><ellipse cx="0" cy="0" rx="70" ry="24"/><circle cx="-26" cy="-14" r="26"/><circle cx="14" cy="-24" r="32"/><circle cx="44" cy="-8" r="22"/></g>`; }

  // ---------- 시기별 건물 (x: 중심, b: 바닥 y) ----------
  const win = (x, y, w = 26, h = 30, c = '#bcd6e3') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${c}" stroke="#fffaf0" stroke-width="3"/>`;
  function grid(x0, y0, cols, rows, dx, dy, w, h, c) { let o = ''; for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) o += win(x0 + q * dx, y0 + r * dy, w, h, c); return o; }
  const L = {
    town(x, b) {
      return `<g>
        <path d="M${x - 300} ${b}V${b - 110}h120V${b}Z" fill="#f4d9b0"/><path d="M${x - 314} ${b - 108} ${x - 240} ${b - 170} ${x - 166} ${b - 108}Z" fill="#d9785b"/>${win(x - 285, b - 92)}<rect x="${x - 230}" y="${b - 58}" width="30" height="58" rx="4" fill="#9b6b4d"/>
        <path d="M${x - 150} ${b}V${b - 90}h110V${b}Z" fill="#e7e2d2"/><path d="M${x - 162} ${b - 88} ${x - 95} ${b - 140} ${x - 28} ${b - 88}Z" fill="#6f8fb5"/>${win(x - 135, b - 72)}${win(x - 85, b - 72)}
        <g stroke="#e0664f" stroke-width="7" fill="none" stroke-linecap="round"><path d="M${x + 20} ${b}V${b - 120}M${x + 60} ${b}V${b - 120}M${x + 20} ${b - 90}h40M${x + 20} ${b - 60}h40M${x + 20} ${b - 30}h40"/></g>
        <path d="M${x + 60} ${b - 120}C${x + 120} ${b - 110} ${x + 120} ${b - 10} ${x + 170} ${b - 6}" stroke="#f2b33d" stroke-width="14" fill="none" stroke-linecap="round"/>
        <g stroke="#7a8a9c" stroke-width="6" fill="none" stroke-linecap="round"><path d="M${x + 200} ${b}l30-130 30 130M${x + 230} ${b - 130}l90 0M${x + 290} ${b}l30-130 30 130"/></g>
        <path d="M${x + 262} ${b - 128}v64M${x + 288} ${b - 128}v64" stroke="#a1aab5" stroke-width="2.5"/><rect x="${x + 255}" y="${b - 66}" width="40" height="8" rx="3" fill="#e0664f"/></g>`;
    },
    school(x, b) {
      return `<g><path d="M${x - 280} ${b}V${b - 190}h560V${b}Z" fill="#f2e7d0"/><path d="M${x - 296} ${b - 186}h592l-20 -24H${x - 276}Z" fill="#c9735a"/>
        <path d="M${x - 70} ${b - 210}V${b - 270}h140V${b - 210}Z" fill="#f2e7d0"/><path d="M${x - 84} ${b - 266} ${x} ${b - 312} ${x + 84} ${b - 266}Z" fill="#c9735a"/><circle cx="${x}" cy="${b - 242}" r="20" fill="#fffaf0" stroke="#8b6a52" stroke-width="3"/><path d="M${x} ${b - 254}v12l8 5" stroke="#5a4a3e" stroke-width="3" fill="none"/>
        ${grid(x - 250, b - 168, 5, 2, 46, 62, 30, 40, '#b8d4e2')}${grid(x + 66, b - 168, 5, 2, 46, 62, 30, 40, '#b8d4e2')}
        <rect x="${x - 34}" y="${b - 84}" width="68" height="84" rx="6" fill="#8f6a4e"/><path d="M${x} ${b - 84}v84" stroke="#7a5840" stroke-width="3"/>
        <path d="M${x + 320} ${b}V${b - 250}" stroke="#9aa3ab" stroke-width="5"/><path d="M${x + 322} ${b - 248}h58l-10 18 10 18h-58Z" fill="#4f8fd0"/></g>`;
    },
    campus(x, b) {
      return `<g><path d="M${x - 300} ${b}V${b - 150}h200V${b}ZM${x + 100} ${b}V${b - 150}h200V${b}Z" fill="#e9dcc4"/><path d="M${x - 310} ${b - 150}h220l-10 -18h-200ZM${x + 90} ${b - 150}h220l-10 -18h-200Z" fill="#9c6b54"/>
        ${grid(x - 280, b - 128, 4, 2, 44, 56, 28, 36, '#c3d8e2')}${grid(x + 122, b - 128, 4, 2, 44, 56, 28, 36, '#c3d8e2')}
        <path d="M${x - 100} ${b}V${b - 220}h200V${b}Z" fill="#f3e9d6"/><path d="M${x - 116} ${b - 218} ${x} ${b - 270} ${x + 116} ${b - 218}Z" fill="#9c6b54"/>
        <g fill="#e3d5bb">${[0, 1, 2, 3, 4].map(k => `<rect x="${x - 86 + k * 38}" y="${b - 200}" width="18" height="150" rx="4"/>`).join('')}</g><path d="M${x - 110} ${b - 50}h220v50h-220Z" fill="#d9c9ab"/>
        <path d="M${x - 26} ${b - 270}V${b - 380}h52V${b - 270}Z" fill="#f3e9d6"/><path d="M${x - 34} ${b - 378} ${x} ${b - 420} ${x + 34} ${b - 378}Z" fill="#9c6b54"/><circle cx="${x}" cy="${b - 340}" r="16" fill="#fffaf0" stroke="#7a5a46" stroke-width="3"/><path d="M${x} ${b - 350}v10l7 4" stroke="#5a4a3e" stroke-width="2.5" fill="none"/>
        ${tree(x - 360, b + 4, .9, 0, 3)}${tree(x + 360, b + 4, .85, 0, 3)}</g>`;
    },
    library(x, b) {
      return `<g><path d="M${x - 260} ${b}V${b - 170}h520V${b}Z" fill="#e5e0d4"/><path d="M${x - 280} ${b - 168}h560l-30 -40H${x - 250}Z" fill="#6f7f95"/>
        ${[0, 1, 2, 3, 4].map(k => `<rect x="${x - 230 + k * 96}" y="${b - 150}" width="60" height="110" rx="30" fill="#c6dbe6" stroke="#fffaf0" stroke-width="4"/>`).join('')}
        <path d="M${x - 280} ${b - 40}h560v12h-560ZM${x - 300} ${b - 28}h600v28h-600Z" fill="#d1c9b8"/>
        <g transform="translate(${x - 40} ${b - 238})"><rect width="80" height="50" rx="8" fill="#fffaf0" stroke="#6f7f95" stroke-width="3"/>${iconAt('book', 40, 25, 32, '#4f6f95')}</g></g>`;
    },
    city(x, b) {
      return `<g><path d="M${x - 320} ${b}V${b - 230}h130V${b}Z" fill="#b8c7cf"/>${grid(x - 304, b - 214, 3, 5, 38, 42, 22, 26, '#eef4f2')}
        <path d="M${x - 170} ${b}V${b - 340}h150V${b}Z" fill="#8ea6b4"/><path d="M${x - 95} ${b - 340}v-50" stroke="#7f8f99" stroke-width="5"/><circle cx="${x - 95}" cy="${b - 392}" r="5" fill="#e0664f"/>${grid(x - 152, b - 320, 4, 7, 34, 42, 20, 26, '#e6f0f0')}
        <path d="M${x} ${b}V${b - 270}h140V${b}Z" fill="#cfd7d2"/>${grid(x + 16, b - 250, 4, 6, 32, 40, 18, 24, '#f4f7f1')}
        <path d="M${x + 160} ${b}V${b - 180}h150V${b}Z" fill="#e2cfb0"/>${grid(x + 178, b - 160, 4, 3, 34, 44, 20, 28, '#fff6e6')}<rect x="${x + 214}" y="${b - 60}" width="44" height="60" rx="4" fill="#7c8d99"/>
        <g transform="translate(${x + 350} ${b})"><path d="M0 0v-110" stroke="#5f6f7a" stroke-width="5"/><rect x="-26" y="-136" width="52" height="36" rx="8" fill="#3f8f6a"/><text x="0" y="-111" text-anchor="middle" font-size="20" font-weight="800" fill="#fff" font-family="PretendardLG, sans-serif">BUS</text></g></g>`;
    },
    garden(x, b) {
      const chairs = [-250, -205, 175, 220].map(dx => `<rect x="${x + dx}" y="${b - 40}" width="30" height="40" rx="5" fill="#fffaf0" stroke="#d9cdb4" stroke-width="2"/>`).join('');
      return `<g><path d="M${x - 120} ${b}V${b - 180}A120 120 0 0 1 ${x + 120} ${b - 180}V${b}" fill="none" stroke="#f2e6cf" stroke-width="18"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => { const a = Math.PI * (k / 8); const cx = x - Math.cos(a) * 120, cy = b - 180 - Math.sin(a) * 120; return `<circle cx="${cx}" cy="${cy}" r="16" fill="${['#f7c5cc', '#ffffff', '#f2a7b5'][k % 3]}"/><circle cx="${cx + 10}" cy="${cy + 8}" r="9" fill="#7fb36a"/>`; }).join('')}
        ${[0, 1, 2, 3].map(k => `<circle cx="${x - 120}" cy="${b - 40 - k * 40}" r="12" fill="${['#ffffff', '#f7c5cc'][k % 2]}"/><circle cx="${x + 120}" cy="${b - 40 - k * 40}" r="12" fill="${['#f7c5cc', '#ffffff'][k % 2]}"/>`).join('')}
        ${chairs}
        ${[[x - 220, '#f2a7b5'], [x - 190, '#ffe08a'], [x + 200, '#b8d8f2'], [x + 232, '#f7c5cc']].map(([bx, c], k) => `<path d="M${bx} ${b - 20}q-6 -90 ${k % 2 ? 6 : -6} -170" stroke="#c9bfae" stroke-width="2" fill="none"/><ellipse cx="${bx + (k % 2 ? 6 : -6)}" cy="${b - 214}" rx="22" ry="27" fill="${c}"/>`).join('')}
        ${iconAt('heart', x, b - 300, 44, '#e0667f')}</g>`;
    },
    home(x, b) {
      return `<g><path d="M${x - 170} ${b}V${b - 170}h300V${b}Z" fill="#f1dcb4"/><path d="M${x - 196} ${b - 166} ${x - 20} ${b - 290} ${x + 156} ${b - 166}Z" fill="#c4704f"/><path d="M${x + 60} ${b - 240}v-50h32v72" fill="#a55f45"/>
        ${win(x - 140, b - 146, 54, 46, '#ffe7a8')}${win(x + 50, b - 146, 54, 46, '#ffe7a8')}${win(x - 48, b - 236, 56, 40, '#ffe7a8')}
        <rect x="${x - 44}" y="${b - 86}" width="52" height="86" rx="6" fill="#7f9a7c"/><circle cx="${x - 2}" cy="${b - 42}" r="3" fill="#f1dcb4"/>
        <g stroke="#fffaf0" stroke-width="6" stroke-linecap="round">${[0, 1, 2, 3, 4, 5, 6].map(k => `<path d="M${x + 150 + k * 24} ${b}v-44"/>`).join('')}<path d="M${x + 144} ${b - 30}h158"/></g>
        <g transform="translate(${x - 220} ${b})"><path d="M0 0v-54" stroke="#8a6a4f" stroke-width="5"/><rect x="-16" y="-80" width="34" height="26" rx="6" fill="#4f8fd0"/></g></g>`;
    },
    apartment(x, b) {
      const block = (bx, h, c, n) => `<path d="M${bx} ${b}V${b - h}h150V${b}Z" fill="${c}"/>${grid(bx + 14, b - h + 18, 4, Math.floor((h - 40) / 34), 33, 34, 22, 20, '#f3f1e7')}<text x="${bx + 75}" y="${b - h + 14}" text-anchor="middle" font-size="13" font-weight="700" fill="#8a8f86" font-family="PretendardLG, sans-serif">${n}</text>`;
      return `<g>${block(x - 330, 300, '#d7dcd3', '101')}${block(x - 150, 360, '#e4ddd0', '102')}${block(x + 30, 280, '#d0d9dd', '103')}<path d="M${x + 210} ${b}V${b - 120}h120V${b}Z" fill="#efe4cf"/><path d="M${x + 200} ${b - 120}h140l-20 -26h-100Z" fill="#c4704f"/><text x="${x + 270}" y="${b - 70}" text-anchor="middle" font-size="22" font-weight="800" fill="#c4704f" font-family="PretendardLG, sans-serif">분양</text></g>`;
    },
    park(x, b) {
      return `<g>${tree(x - 220, b + 4, 1.25, 0, 0)}${tree(x + 210, b + 4, 1.05, 0, 1)}<ellipse cx="${x + 10}" cy="${b - 12}" rx="120" ry="20" fill="#9fcbe0"/><ellipse cx="${x - 10}" cy="${b - 16}" rx="60" ry="6" fill="#c4e1ee"/>
        <g transform="translate(${x + 330} ${b})"><path d="M0 0v-170" stroke="#4f5a5f" stroke-width="6"/><path d="M-18 -170h36l-6 -26h-24Z" fill="#4f5a5f"/><circle cx="0" cy="-160" r="9" fill="#ffe7a8"/></g></g>`;
    },
  };
  function landmark(scene, x, b) { return (L[scene] || L.town)(x, b); }

  // ---------- 선택이 남기는 배경 소품 (x: 중심, b: 바닥 y) ----------
  const T = (x, y, s, t, fill = '#fff', w = 800) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${s}" font-weight="${w}" fill="${fill}" font-family="PretendardLG, sans-serif">${t}</text>`;
  const tiny = (x, b, top, hairCol = '#3a2c28', wave = false) => `<g transform="translate(${x} ${b}) scale(.55)"><path d="M-6 0v-48M6 0v-48" stroke="#4b5568" stroke-width="11" stroke-linecap="round"/><rect x="-18" y="-96" width="36" height="50" rx="12" fill="${top}"/><circle cx="2" cy="-120" r="24" fill="#f1c7a2"/><path d="M-22 -122c-2-22 12-30 28-28 15 2 21 12 20 24-8-8-18-9-28-8-9 1-14 5-20 12Z" fill="${hairCol}"/>${wave ? '<path d="M18 -90 34 -130" stroke="#f1c7a2" stroke-width="10" stroke-linecap="round"/>' : ''}</g>`;
  const PROPS = {
    academy(x, b) {
      return `<g><path d="M${x - 150} ${b}V${b - 230}h300V${b}Z" fill="#e9e2d6"/>${[0, 1, 2].map(r => [0, 1, 2, 3].map(q => win(x - 130 + q * 70, b - 150 + r * 46, 40, 26, '#cfe0ea')).join('')).join('')}
        <rect x="${x - 140}" y="${b - 222}" width="130" height="40" rx="6" fill="#3b78d4"/>${T(x - 75, b - 194, 22, '수학 학원')}
        <rect x="${x + 6}" y="${b - 222}" width="130" height="40" rx="6" fill="#e2577a"/>${T(x + 71, b - 194, 22, '영어 학원')}
        <rect x="${x - 50}" y="${b - 268}" width="100" height="36" rx="6" fill="#e39a12"/>${T(x, b - 243, 20, '입시 상담')}</g>`;
    },
    playground(x, b) {
      return `<g><g stroke="#e0664f" stroke-width="7" fill="none" stroke-linecap="round"><path d="M${x - 120} ${b}V${b - 110}M${x - 84} ${b}V${b - 110}M${x - 120} ${b - 80}h36M${x - 120} ${b - 50}h36"/></g>
        <path d="M${x - 84} ${b - 110}C${x - 30} ${b - 100} ${x - 30} ${b - 8} ${x + 20} ${b - 4}" stroke="#f2b33d" stroke-width="13" fill="none" stroke-linecap="round"/>
        <ellipse cx="${x + 100}" cy="${b - 6}" rx="70" ry="12" fill="#f0dcae"/>${tiny(x + 70, b - 4, '#6fbf73', '#4a3426', true)}${tiny(x + 130, b - 4, '#f08a5d', '#2e2420')}</g>`;
    },
    bighouse(x, b) {
      return `<g><path d="M${x - 170} ${b}V${b - 220}h340V${b}Z" fill="#f3ead8"/><path d="M${x - 190} ${b - 216}h380l-30-46H${x - 160}Z" fill="#4f6f95"/>
        ${win(x - 140, b - 196, 70, 54, '#ffe7a8')}${win(x - 35, b - 196, 70, 54, '#ffe7a8')}${win(x + 70, b - 196, 70, 54, '#ffe7a8')}${win(x - 140, b - 110, 70, 54, '#ffe7a8')}
        <rect x="${x - 30}" y="${b - 100}" width="50" height="100" rx="6" fill="#7f6a55"/><rect x="${x + 50}" y="${b - 80}" width="110" height="80" rx="4" fill="#d9d2c4"/><path d="M${x + 50} ${b - 60}h110M${x + 50} ${b - 40}h110M${x + 50} ${b - 20}h110" stroke="#c4bba9" stroke-width="2"/>
        <rect x="${x - 70}" y="${b - 262}" width="140" height="36" rx="8" fill="#fffaf0" stroke="#4f6f95" stroke-width="3"/>${T(x, b - 237, 20, '우리 집', '#4f6f95')}</g>`;
    },
    bigcar(x, b) {
      return `<g transform="translate(${x} ${b})"><path d="M-120 -24c0-20 10-30 36-34l34-26h96l40 26c30 4 34 14 34 34v14h-240Z" fill="#b8323c"/><path d="M-46 -78h40v24h-60ZM2 -78h40l26 24h-66Z" fill="#cfe6f2"/><path d="M-120 -30h240" stroke="#ffffff" stroke-opacity=".4" stroke-width="3"/><circle cx="-70" cy="-8" r="20" fill="#2b2b2b"/><circle cx="-70" cy="-8" r="8" fill="#c9c9c9"/><circle cx="72" cy="-8" r="20" fill="#2b2b2b"/><circle cx="72" cy="-8" r="8" fill="#c9c9c9"/><path d="M110 -40h10" stroke="#ffe08a" stroke-width="6" stroke-linecap="round"/><path d="M-60 -110l6-14 6 14 14 6-14 6-6 14-6-14-14-6Z" fill="#ffe08a"/></g>`;
    },
    oldcar(x, b) {
      return `<g transform="translate(${x} ${b})"><path d="M-90 -18c0-18 8-26 26-28l18-30h74l22 30c18 2 24 10 24 28v8h-164Z" fill="#9db4a6"/><path d="M-40 -72h30v22h-44ZM-2 -72h30l14 22h-44Z" fill="#dfeef2"/><circle cx="40" cy="-28" r="7" fill="#b2785a" opacity=".8"/><path d="M-70 -34l10 6" stroke="#6f8578" stroke-width="2"/><circle cx="-50" cy="-6" r="16" fill="#2b2b2b"/><circle cx="-50" cy="-6" r="6" fill="#bbb"/><circle cx="50" cy="-6" r="16" fill="#2b2b2b"/><circle cx="50" cy="-6" r="6" fill="#bbb"/></g>`;
    },
    shop(x, b) {
      return `<g><path d="M${x - 120} ${b}V${b - 170}h240V${b}Z" fill="#f2e7d0"/>${[0, 1, 2, 3, 4, 5].map(k => `<path d="M${x - 130 + k * 44} ${b - 170}h44l-6 34h-32Z" fill="${k % 2 ? '#fffaf0' : '#22977a'}"/>`).join('')}
        <rect x="${x - 100}" y="${b - 120}" width="120" height="80" rx="4" fill="#cfe6f2"/><rect x="${x + 40}" y="${b - 110}" width="56" height="110" rx="4" fill="#8a5a3c"/>
        <rect x="${x - 86}" y="${b - 104}" width="92" height="30" rx="6" fill="#e39a12"/>${T(x - 40, b - 82, 18, 'OPEN')}${T(x, b - 182, 24, '두 번째 가게', '#22977a')}</g>`;
    },
    garden(x, b) {
      return `<g>${[0, 1, 2].map(r => `<path d="M${x - 150} ${b - 8 - r * 22}h300" stroke="#8a6a4f" stroke-width="12" stroke-linecap="round"/>${[0, 1, 2, 3, 4, 5].map(k => `<circle cx="${x - 130 + k * 52 + (r % 2) * 20}" cy="${b - 18 - r * 22}" r="9" fill="${['#6fae6a', '#e2577a', '#f2b33d'][(k + r) % 3]}"/>`).join('')}`).join('')}
        <g transform="translate(${x + 170} ${b - 10})"><path d="M-18 0h30l4-28h-38Z" fill="#4f78b8"/><path d="M12 -22 34 -40" stroke="#4f78b8" stroke-width="5"/></g>
        <g transform="translate(${x - 190} ${b})"><path d="M0 0v-110M-30 -80h60" stroke="#8a6447" stroke-width="6"/><circle cx="0" cy="-124" r="16" fill="#f3e3c3"/><path d="M-22 -132h44l-8-16h-28Z" fill="#e7c77a"/></g></g>`;
    },
    parentshome(x, b) {
      return `<g><path d="M${x - 120} ${b}V${b - 130}h200V${b}Z" fill="#f1dcb4"/><path d="M${x - 140} ${b - 126} ${x - 20} ${b - 210} ${x + 100} ${b - 126}Z" fill="#b97d62"/>
        ${win(x - 100, b - 110, 50, 40, '#ffe7a8')}<rect x="${x - 30}" y="${b - 80}" width="44" height="80" rx="5" fill="#7f9a7c"/>
        ${tiny(x + 120, b, '#9a8cb4', '#dedad2', true)}${tiny(x + 170, b, '#b07a6a', '#e6e2da', true)}</g>`;
    },
    hospital(x, b) {
      return `<g><path d="M${x - 160} ${b}V${b - 220}h320V${b}Z" fill="#f4f6f5"/>${[0, 1, 2].map(r => [0, 1, 2, 3, 4].map(q => win(x - 140 + q * 58, b - 200 + r * 52, 36, 30, '#cfe0ea')).join('')).join('')}
        <rect x="${x - 34}" y="${b - 60}" width="68" height="60" rx="4" fill="#9fb8c8"/><g transform="translate(${x} ${b - 250})"><rect x="-30" y="-30" width="60" height="60" rx="12" fill="#fff" stroke="#e05a5a" stroke-width="4"/><path d="M-6 -18h12v12h12v12h-12v12h-12v-12h-12v-12h12Z" fill="#e05a5a"/></g></g>`;
    },
  };
  function prop(name, x, b) { return PROPS[name] ? `<g class="prop">${PROPS[name](x, b)}</g>` : ''; }

  function bench(x, b) {
    return `<g transform="translate(${x} ${b})"><rect x="-90" y="-62" width="180" height="14" rx="5" fill="#b9814f"/><rect x="-90" y="-42" width="180" height="14" rx="5" fill="#c79060"/><rect x="-96" y="-22" width="192" height="12" rx="5" fill="#b9814f"/><path d="M-76 -10v10M76 -10v10M-76 -48v28M76 -48v28" stroke="#5a5048" stroke-width="7" stroke-linecap="round"/></g>`;
  }

  // ---------- 갈림길 문 ----------
  function gate(x, y, label, key, color, locked = false, faded = false) {
    if (faded) color = '#b7b2a6';
    // 기둥 120 + 아치 반지름 66. 이름판은 아치 꼭대기에 겹쳐 달아 위쪽 HUD에 가리지 않게 한다.
    const arch = `M${x - 66} ${y}V${y - 120}a66 66 0 0 1 132 0V${y}`;
    return `<g class="gate gate-${key}" data-key="${key}">
      <path class="portal" d="M${x - 58} ${y}V${y - 120}a58 58 0 0 1 116 0V${y}Z" fill="url(#portal-${key})"/>
      <path d="${arch}" fill="none" stroke="${color}" stroke-width="15" stroke-linejoin="round"/>
      <path d="${arch}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="4" stroke-dasharray="2 14" stroke-linecap="round"/>
      <g class="sign"><rect x="${x - 124}" y="${y - 214}" width="248" height="58" rx="16" fill="#fffaf0" stroke="${color}" stroke-width="5"/>
        <circle cx="${x - 95}" cy="${y - 185}" r="20" fill="${color}"/><text x="${x - 95}" y="${y - 177}" text-anchor="middle" font-size="23" font-weight="800" fill="#fff" font-family="PretendardLG, sans-serif">${key === 'a' ? '1' : '2'}</text>
        <text x="${x + 14}" y="${y - 175}" text-anchor="middle" font-size="${label.length > 8 ? 21 : label.length > 6 ? 24 : 27}" font-weight="800" fill="#24312b" font-family="PretendardLG, sans-serif">${label.replace(/[<&]/g, '')}</text></g>
      ${locked ? `<g class="barricade"><path d="M${x - 62} ${y - 128}L${x + 62} ${y - 28}M${x + 62} ${y - 128}L${x - 62} ${y - 28}" stroke="#f2c94c" stroke-width="20" stroke-linecap="round"/><path d="M${x - 62} ${y - 128}L${x + 62} ${y - 28}M${x + 62} ${y - 128}L${x - 62} ${y - 28}" stroke="#2f2f2f" stroke-width="20" stroke-dasharray="12 12"/><rect x="${x - 46}" y="${y - 96}" width="92" height="34" rx="8" fill="#fffaf0" stroke="#2f2f2f" stroke-width="3"/><text x="${x}" y="${y - 72}" text-anchor="middle" font-size="20" font-weight="800" fill="#2f2f2f" font-family="PretendardLG, sans-serif">닫힌 길</text></g>` : ''}
      <g class="sparkles" fill="${color}">${[[-40, -150], [44, -136], [-8, -176], [56, -80], [-58, -60]].map(([dx, dy], k) => `<path transform="translate(${x + dx} ${y + dy}) scale(${.7 + (k % 3) * .25})" d="M0-10 2.5-2.5 10 0 2.5 2.5 0 10-2.5 2.5-10 0-2.5-2.5Z"/>`).join('')}</g></g>`;
  }

  root.LifeArt = { icon, iconAt, person, held, tree, bush, flowers, grass, cloud, landmark, prop, bench, gate, lifeStage, shade, LOOKS, SCALE };
})(typeof window !== 'undefined' ? window : globalThis);
