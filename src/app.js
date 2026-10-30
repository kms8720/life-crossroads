// 화면·입력·애니메이션. 규칙은 LifeEngine, 그림은 LifeArt가 맡는다.
(function () {
  'use strict';
  const E = window.LifeEngine, A = window.LifeArt;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const easeInOut = t => -(Math.cos(Math.PI * t) - 1) / 2;

  // ---------- 월드 좌표 ----------
  const W = 1920, ROAD = 540, UP = -160, DOWN = 120, X0 = 3000, D = 3800;
  // 갈림길(X 기준): SPLIT0~SPLIT1에서 갈라지고 FLAT까지 나란히 간다. 갈림길 화면(X+820까지 보임)에서는 다시 모이는 곳이 안 보인다.
  // 고른 길만 FLAT~MERGE1에서 큰길로 이어지고, 고르지 않은 길은 TAIL_END까지 바깥으로 뻗으며 흐려진다.
  const SPLIT0 = -520, SPLIT1 = -160, FLAT = 950, MERGE1 = 1550, TAIL_END = 1550, TAIL_UP = 80, TAIL_DOWN = 150, GATE = 80;
  const FORK_X = -700, FORK_CAM = -1100, RES_X = 1720, RES_CAM = 900, TITLE_X = 560;
  const PARTNER_DX = -128, KID_DX = 88, BASE = 494;
  const OPT = [{ key: 'a', c: '#ef6a4c', cs: '#fde6df', cg: 'rgba(239,106,76,.28)', arrow: '▲' }, { key: 'b', c: '#6f5bd6', cs: '#e9e5fb', cg: 'rgba(111,91,214,.28)', arrow: '▼' }];
  const SAVE_KEY = 'insaeng-galimgil.save.v4', SET_KEY = 'insaeng-galimgil.settings.v4';

  let C, REV, settings, state, history = [], world, savedGame = null;
  const view = { x: TITLE_X, cam: 0, age: 8, lane: 0, fork: -1 };
  const ui = { notes: false, modal: null, highlight: null, moving: false, showGauges: true, rewindSel: null, give: null };
  let peopleKey = '', lastLook = null;
  const present = () => !!settings.present;           // 발표 모드: 팀 의도 공개 · 반 투표 · 하나 바꾸기
  const votesOn = () => present() && settings.votes;

  // ---------- 저장 (막혀 있어도 게임은 돌아간다) ----------
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가: 무시 */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* 무시 */ } },
  };
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function loadSettings() {
    const d = E.defaultSettings(C), s = store.get(SET_KEY);
    if (!s || !s.v) return d;
    // 콘텐츠가 바뀌어도 설정은 유지한다. 사라진 시기는 버리고 새 시기는 기본값을 따른다.
    const stages = Object.fromEntries(Object.keys(d.stages).map(id => [id, s.v.stages?.[id] ?? d.stages[id]]));
    const { randomQuestions, ...rest } = s.v; // 질문은 항상 나이대별 무작위
    return { ...d, ...rest, stages };
  }
  function saveSettings() { store.set(SET_KEY, { rev: REV, v: settings }); }
  function saveGame() {
    if (state.phase === 'title') return;
    store.set(SAVE_KEY, { rev: REV, state, history: history.slice(-80) });
  }

  // ---------- 효과음 ----------
  const Sound = (() => {
    let ctx = null, out = null, files = {};
    try { files = JSON.parse($('#game-sounds')?.textContent || '{}'); } catch { files = {}; }
    const ac = () => {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
        out = ctx.createGain(); out.gain.value = .7; out.connect(comp).connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    // 부드러운 사인·삼각파만 쓴다. 시작·끝을 천천히 올리고 내려 '딱' 소리가 나지 않게 한다.
    function tone(f, dur, { type = 'sine', gain = .05, at = 0, slide = 0 } = {}) {
      const c = ac(), t0 = c.currentTime + .02 + at, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t0 + dur);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + .03); g.gain.setTargetAtTime(0, t0 + dur * .45, dur / 4);
      o.connect(g).connect(out); o.start(t0); o.stop(t0 + dur + .4);
    }
    const synth = {
      gate() { tone(784, .3, { gain: .04 }); tone(1175, .4, { gain: .03, at: .09 }); },
      card() { [523, 659, 784].forEach((f, k) => tone(f, .35, { type: 'triangle', gain: .028, at: k * .08 })); },
      pop() { tone(660, .16, { type: 'triangle', gain: .035, slide: 1.4 }); },
      page() { tone(1320, .12, { type: 'triangle', gain: .02, slide: .55 }); tone(1180, .12, { type: 'triangle', gain: .018, at: .16, slide: .55 }); },
      // 아이들 웃음 흉내. 녹음 파일(sounds/laugh.*)을 넣으면 그 파일로 바뀐다.
      laugh() { [0, .15, .29, .42, .56].forEach((at, k) => tone(760 + (k % 2) * 120, .14, { type: 'triangle', gain: .025, at, slide: .8 })); },
      confetti() { [0, .08, .16, .24].forEach((at, k) => tone(988 + k * 220, .28, { gain: .025, at })); },
      give() { [784, 988, 1319].forEach((f, k) => tone(f, .5, { gain: .03, at: k * .1 })); },
      lock() { tone(220, .3, { type: 'triangle', gain: .04, slide: .8 }); },
    };
    return {
      play(name) {
        if (!settings?.sound) return;
        try { if (files[name]) { const a = new Audio(files[name]); a.volume = .8; a.play().catch(() => {}); } else synth[name]?.(); } catch { /* 소리 불가: 무시 */ }
      },
    };
  })();

  // ---------- 무대 크기 맞추기 ----------
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    const st = $('#stage');
    st.style.transform = `scale(${s})`;
    st.style.left = `${(innerWidth - 1920 * s) / 2}px`;
    st.style.top = `${(innerHeight - 1080 * s) / 2}px`;
  }

  // ---------- 월드 만들기 ----------
  // 캐릭터가 걷는 높이. 갈림길 안에서는 고른 길(lane -1 위 / 1 아래)을 따라간다.
  function laneY(x, lane) {
    if (!lane || !world) return ROAD;
    for (const X of world.xs) if (x >= X + SPLIT0 && x <= X + MERGE1) return laneShape(x, X, lane, true);
    return ROAD;
  }
  function laneShape(x, X, lane, chosen) {
    const off = lane < 0 ? UP : DOWN, split = smooth((x - (X + SPLIT0)) / (SPLIT1 - SPLIT0));
    if (chosen) return ROAD + off * (split - smooth((x - (X + FLAT)) / (MERGE1 - FLAT)));
    return ROAD + off * split + (lane < 0 ? -TAIL_UP : TAIL_DOWN) * smooth((x - (X + FLAT)) / (TAIL_END - FLAT));
  }
  function rand(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hills(width, base, amp, step, seed, color) {
    const r = rand(seed); let d = `M0 1080L0 ${base}`;
    let prev = base;
    for (let x = 0; x <= width + step; x += step) { const y = base - amp * (0.35 + r() * 0.65); d += ` Q${x - step / 2} ${(prev + y) / 2 - amp * 0.35} ${x} ${y}`; prev = y; }
    return `<path d="${d} L${width + step} 1080Z" fill="${color}"/>`;
  }
  function buildWorld(stageIds) {
    const stages = stageIds.map(id => C.stages.find(s => s.id === id));
    const xs = stages.map((_, i) => X0 + i * D);
    const xEnd = (xs.at(-1) ?? X0) + 3200, width = xEnd + 1800;
    world = { stages, xs, xEnd, width };
    const r = rand(20261112);
    // 하늘·먼 산·가까운 언덕
    $('#clouds').innerHTML = `<g>${Array.from({ length: 7 }, (_, k) => A.cloud(140 + k * 300 + r() * 120, 110 + r() * 130, .7 + r() * .5)).join('')}</g>`;
    $('#stars').innerHTML = Array.from({ length: 40 }, () => `<circle cx="${r() * 1920}" cy="${r() * 380}" r="${1 + r() * 2}" fill="#fff"/>`).join('');
    $('#far').innerHTML = hills(width * .12 + W, 400, 120, 360, 3, '#b7d6cd') + hills(width * .12 + W, 450, 70, 240, 4, '#a9cdb9');
    let mid = hills(width * .35 + W, 478, 60, 300, 5, '#9cc993');
    for (let x = 80; x < width * .35 + W; x += 140 + r() * 160) mid += A.tree(x, 470 + r() * 10, .32 + r() * .14, r() < .3 ? 1 : 0, Math.floor(r() * 3));
    $('#mid').innerHTML = mid;
    // 땅·건물·나무
    const busy = [[-400, 900], ...xs.flatMap(X => [[X - 1240, X - 360], [X + SPLIT0 - 120, X + TAIL_END + 700]]), [xEnd - 520, xEnd + 520]];
    const free = x => !busy.some(([a, b]) => x > a && x < b);
    let g = `<rect x="-200" y="470" width="${width + 400}" height="700" fill="url(#meadow-grad)"/>`;
    g += A.landmark('home', 330, BASE) + `<g transform="translate(860 ${BASE})"><path d="M0 0v-120" stroke="#8a6a4f" stroke-width="6"/><path d="M-6 -118h120l22 22-22 22H-6Z" fill="#fffaf0" stroke="#2f5d4a" stroke-width="4"/><text x="58" y="-87" text-anchor="middle" font-size="24" font-weight="800" fill="#2f5d4a" font-family="PretendardLG, sans-serif">출발 →</text></g>`.replace('translate(860 ', 'translate(720 ');
    stages.forEach((s, i) => { g += A.landmark(s.scene, xs[i] - 800, BASE); });
    for (let x = 60; x < width; x += 210 + r() * 260) if (free(x)) g += A.tree(x, BASE - 2 + r() * 8, .62 + r() * .35, r() < .25 ? 1 : 0, Math.floor(r() * 3));
    // 엔딩 공원
    g += A.tree(xEnd - 380, BASE + 6, 1.45, 0, 0) + A.tree(xEnd - 640, BASE + 6, 1.05, 0, 1) + A.bench(xEnd - 190, BASE + 4) + A.flowers(xEnd - 300, BASE + 2, 5) + `<g transform="translate(${xEnd + 30} ${BASE})"><path d="M0 0v-190" stroke="#4f5a5f" stroke-width="7"/><path d="M-20 -190h40l-7 -28h-26Z" fill="#4f5a5f"/><circle cx="0" cy="-178" r="10" fill="#ffe7a8"/></g>`;
    $('#ground').innerHTML = g;
    // 고르지 않은 길 끝은 마스크 대신 선 색 그라데이션으로 흐리게 한다 (마스크·필터는 움직일 때마다 다시 그려져 느리다).
    const tailDefs = xs.map((X, i) => ROAD_PAL.map((pal, pi) => pal.map((col, ci) => `<linearGradient id="tail-${i}-${pi}-${ci}" gradientUnits="userSpaceOnUse" x1="${X + FLAT - 60}" y1="0" x2="${X + TAIL_END}" y2="0"><stop offset="0" stop-color="${col}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient>`).join('')).join('')).join('');
    const straight = []; let from = -200;
    xs.forEach(X => { straight.push([from, X + SPLIT0]); from = X + MERGE1; });
    straight.push([from, width + 200]);
    $('#roads').innerHTML = `<defs>${tailDefs}</defs>${xs.map((_, i) => `<g id="mound-${i}"></g>`).join('')}${roadSvg(straight.map(([a, b]) => `M${a} ${ROAD}H${b}`).join(''), ROAD_PAL[0])}${xs.map((_, i) => `<g id="fork-${i}"></g>`).join('')}`;
    $('#gates').innerHTML = xs.map((_, i) => `<g id="gates-${i}"></g>`).join('');
    world.forkKeys = []; world.gateKeys = []; world.propsKey = null;
    renderRoads({});
    // 길가 꽃·풀
    let dec = '';
    for (let x = 100; x < width; x += 120 + r() * 160) { const y = 620 + r() * 380; if (!xs.some(X => x > X + SPLIT0 - 60 && x < X + TAIL_END + 160 && y < 860)) dec += r() < .55 ? A.flowers(x, y, Math.floor(r() * 100)) : A.grass(x, y); }
    xs.forEach(X => { dec += A.flowers(X - 40, 470, 3) + A.flowers(X + 260, 700, 7); });
    $('#decor').innerHTML = dec;
    let fg = '';
    for (let x = 0; x < width * 1.2 + W; x += 300 + r() * 420) fg += A.bush(x, 1110 + r() * 20, 1.6 + r() * 1.2, r() < .5 ? '#6fa95e' : '#78b366');
    $('#fg').innerHTML = fg;
  }
  // 길 색: [바깥 테두리, 길 바탕, 가운데 점선] — 보통 / 지나간(고르지 않은) 길
  const ROAD_PAL = [['#d6c197', '#f3e6c6', '#e1cb9c'], ['#c9c5b8', '#e6e3da', '#d4d0c4']];
  const roadSvg = (d, pal, extra = '') => `<g class="lane" ${extra}><path d="${d}" stroke="${pal[0]}" stroke-width="80" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${pal[1]}" stroke-width="64" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${pal[2]}" stroke-width="4" stroke-dasharray="16 22" fill="none"/></g>`;
  const trace = (a, b, f) => { let d = `M${a} ${f(a).toFixed(1)}`; for (let x = a + 20; x <= b; x += 20) d += ` L${x} ${f(x).toFixed(1)}`; return d; };
  // 갈림길 i의 두 갈래. unchosen[i]: 고르지 않은 쪽(0 위 / 1 아래), 2는 건너뜀, 없으면 아직 안 고름.
  function renderRoads(unchosen) {
    if (!world) return;
    world.xs.forEach((X, i) => {
      const u = unchosen[i], key = String(u ?? '-');
      if (world.forkKeys[i] === key) return; // 바뀐 갈림길만 다시 그린다
      world.forkKeys[i] = key;
      const chosenLane = u === 0 ? 1 : u === 1 ? -1 : null, upChosen = chosenLane === -1;
      const hill = x => x <= X + TAIL_END ? laneShape(x, X, -1, upChosen) - 34 : lerp(laneShape(X + TAIL_END, X, -1, upChosen) - 34, ROAD - 10, smooth((x - (X + TAIL_END)) / 600));
      const hx0 = X + SPLIT0 - 140, hx1 = X + TAIL_END + 640;
      $(`#mound-${i}`).innerHTML = `<path d="${trace(hx0, hx1, x => Math.min(ROAD - 10, hill(x)))} L${hx1} ${ROAD} L${hx0} ${ROAD} Z" fill="#9fcd88"/>`;
      $(`#fork-${i}`).innerHTML = [-1, 1].map(lane => {
        const chosen = lane === chosenLane, faded = u === 2 || (u != null && !chosen), pi = faded ? 1 : 0;
        const d = trace(X + SPLIT0, chosen ? X + MERGE1 : X + TAIL_END, x => laneShape(x, X, lane, chosen));
        const pal = chosen ? ROAD_PAL[0] : ROAD_PAL[pi].map((_, ci) => `url(#tail-${i}-${pi}-${ci})`);
        return roadSvg(d, pal, `data-fork="${i}" data-lane="${lane}"`);
      }).join('');
    });
  }

  // ---------- 자세 (상태 → 캐릭터·카메라 위치) ----------
  const forkPose = i => ({ x: world.xs[i] + FORK_X, cam: world.xs[i] + FORK_CAM });
  const resultPose = i => ({ x: world.xs[i] + RES_X, cam: world.xs[i] + RES_CAM });
  const endPose = () => ({ x: world.xEnd - 130, cam: world.xEnd - 130 - 420 });
  const titlePose = () => ({ x: TITLE_X, cam: 0 });
  function restBefore(i) { return i === 0 ? titlePose() : resultPose(i - 1); }
  function poseOf(s) {
    let p;
    switch (s.phase) {
      case 'title': case 'start': p = titlePose(); break;
      case 'fork': p = forkPose(s.i); break;
      case 'result': p = resultPose(s.i); break;
      case 'event': { const a = restBefore(s.i), b = s.i < world.xs.length ? forkPose(s.i) : endPose(); p = { x: (a.x + b.x) / 2, cam: (a.cam + b.cam) / 2 }; break; }
      case 'ending': p = endPose(); break;
      default: p = titlePose();
    }
    return { ...p, age: s.phase === 'title' ? C.startAge : E.ageOf(C, s), lane: 0, fork: -1 };
  }

  // ---------- 그리기: 하늘·사람·카메라 ----------
  const SKY = [[0, '#a9dcef', '#fff3d4'], [.3, '#8ccfee', '#eef7ec'], [.6, '#9cc5e5', '#fde8c2'], [.82, '#efb07e', '#fde0b6'], [1, '#7c69a6', '#f6a877']];
  const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(lerp(v, y[i], t)).toString(16).padStart(2, '0')).join(''); };
  function drawSky(age) {
    const p = clamp((age - C.startAge) / (C.endingAge - C.startAge), 0, 1);
    let k = 0; while (k < SKY.length - 2 && p > SKY[k + 1][0]) k++;
    const [p0, t0, b0] = SKY[k], [p1, t1, b1] = SKY[k + 1], t = (p - p0) / (p1 - p0);
    $('#sky-top').setAttribute('stop-color', mix(t0, t1, t));
    $('#sky-bottom').setAttribute('stop-color', mix(b0, b1, t));
    const sx = 250 + p * 1450, sy = 430 - Math.sin(Math.PI * clamp(p * 1.05, 0, 1)) * 300;
    $('#sun').setAttribute('transform', `translate(${sx} ${sy})`);
    $('#sun-core').setAttribute('fill', p < .5 ? mix('#fff3b8', '#ffe07a', p * 2) : mix('#ffe07a', '#ff9d62', (p - .5) * 2));
    $('#tint').setAttribute('opacity', (smooth((p - .6) / .4) * .16).toFixed(3));
    $('#stars').setAttribute('opacity', smooth((p - .9) / .1).toFixed(2));
  }
  const HATS = ['beret', 'strawhat', 'headband'], MOOD_YEARS = 15;
  function pickView(p) { const st = C.stages.find(x => x.id === p.stageId), q = st.questions.find(x => x.id === p.qid); return { st, q, o: E.optionView(q, p.opt, p.ev || []) }; }
  // 지금까지의 선택이 화면에 남긴 것: 옷·소품·손에 든 것·표정·함께 걷는 사람 (content.json의 show)
  function appearance(s, age) {
    const me = { wear: new Set(), outfit: null, hold: null }, moods = {};
    let partner = null, partnerHold = null, kidHold = null, friends = null, friendBack = false, parentAt = null, give = null;
    const picks = s.picks || [];
    picks.forEach((p, idx) => {
      const { st, o } = pickView(p), sh = o.show || {}, latest = idx === picks.length - 1;
      for (const w of sh.wear || []) {
        if (sh.wearUntil != null && age >= sh.wearUntil) { me.wear.delete(w); continue; }
        if (HATS.includes(w)) HATS.forEach(h => me.wear.delete(h)); // 모자는 하나만
        me.wear.add(w);
      }
      for (const w of sh.remove || []) me.wear.delete(w);
      if (sh.outfit) me.outfit = sh.outfit;
      if (sh.hold) { const on = sh.holdUntil != null ? age < sh.holdUntil : latest; if (on) me.hold = sh.hold; else if (me.hold === sh.hold) me.hold = null; }
      partnerHold = latest ? sh.partnerHold || null : partnerHold && null;
      kidHold = latest ? sh.kidHold || null : kidHold && null;
      if (sh.lover || sh.partner === 'same') partner = partner || { look: 'partner' };
      if (sh.partner === 'new' || sh.partner === 'new2') { partner = { look: sh.partner === 'new' ? 'partner2' : 'partner3' }; delete moods.partner; }
      if (sh.mood && age < st.age + MOOD_YEARS) Object.assign(moods, sh.mood); // 표정은 시간이 지나면 돌아온다
      if (sh.friends) friends = sh.friends === 'old' ? ['friend1'] : ['friend2', 'friend3'];
      if (sh.friendBack) friendBack = true;
      if ((o.set || []).includes('parent')) parentAt = st.age;
      if (latest && sh.give && s.phase === 'result') give = sh.give;
    });
    // 꽃·반지 건네기: 결과 화면에서 둘이 마주 보고, 단계(before → flying → done)에 따라 손에 든 사람이 바뀐다.
    let face = null, meReach = false, pReach = false;
    if (give && partner) {
      const stage = ui.give?.stage || 'done', fromMe = give.from === 'me';
      if (!ui.moving) face = 'left';
      if (stage === 'before') { if (fromMe) me.hold = give.item; else partnerHold = give.item; }
      if (stage === 'done') { if (fromMe) partnerHold = give.item; else me.hold = give.item; }
      if (!ui.moving && stage !== 'done') { meReach = fromMe || stage === 'flying'; pReach = !fromMe || stage === 'flying'; }
    }
    const kidAge = parentAt != null ? age - parentAt : null;
    const kid = kidAge != null ? { age: kidAge, baby: kidAge < 4, hold: kidHold, mood: moods.kid || null } : null;
    const partnerMood = kid ? moods.partner : moods.kid || moods.partner; // 아이가 없으면 아이 표정 대신 배우자 표정으로
    const fr = friendBack ? ['friend1'] : friends && !partner && age < 23 ? friends : [];
    return { me: { wear: [...me.wear], outfit: me.outfit, hold: me.hold, reach: meReach, face }, partner: partner && { look: partner.look, hold: partnerHold, mood: partnerMood || null, reach: pReach }, kid, friends: fr, friendBack, give };
  }
  function drawPeople(age, s, popNew = false) {
    const ap = appearance(s, age);
    const key = JSON.stringify({ st: A.lifeStage(age), me: ap.me, p: ap.partner, k: ap.kid && { st: A.lifeStage(ap.kid.age), baby: ap.kid.baby, hold: ap.kid.hold, mood: ap.kid.mood }, f: ap.friends });
    if (key === peopleKey) return;
    peopleKey = key;
    const prev = lastLook; lastLook = ap;
    const pop = cond => popNew && cond ? 'pop' : '';
    const meSvg = A.person('me', age, { ...ap.me, baby: ap.kid?.baby });
    $('#me').innerHTML = ap.me.face === 'left' ? `<g transform="scale(-1 1)">${meSvg}</g>` : meSvg;
    $('#partner').innerHTML = ap.partner ? `<g class="${pop(!prev?.partner || prev.partner.look !== ap.partner.look)}">${A.person(ap.partner.look, age, ap.partner)}</g>` : '';
    $('#kid').innerHTML = ap.kid && !ap.kid.baby ? `<g class="${pop(!prev?.kid || prev.kid.baby)}">${A.person('kid', ap.kid.age, ap.kid)}</g>` : '';
    const start = ap.partner ? 1 : 0, slots = [PARTNER_DX, KID_DX, KID_DX + 100];
    $('#friends').innerHTML = ap.friends.map((f, k) => `<g class="fr" data-dx="${slots[k + start]}"><g class="${pop(!(prev?.friends || []).includes(f))}">${A.person(f, ap.friendBack ? age : Math.min(age, 22), {})}</g></g>`).join('');
    if (popNew && prev && ap.partner && prev.partner && prev.partner.look !== ap.partner.look) ghost(A.person(prev.partner.look, age, {}), PARTNER_DX);
    if (popNew && prev && prev.friends.length && !ap.friends.length) prev.friends.forEach((f, k) => ghost(A.person(f, Math.min(age, 22), {}), [PARTNER_DX, KID_DX, KID_DX + 100][k]));
    place(view.x, view.cam, view.lane);
  }
  // 떠나는 사람: 잠깐 손 흔들고 흐려진다.
  function ghost(svg, dx) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'ghost'); g.setAttribute('transform', `translate(${view.x + dx} ${laneY(view.x + dx, view.lane)})`);
    g.innerHTML = `<g class="leave">${svg}</g>`;
    $('#people').insertBefore(g, $('#people').firstChild);
    setTimeout(() => g.remove(), 1700);
  }
  function renderProps(s, popLatest = false) {
    if (!world) return;
    const picks = s.picks || [];
    const key = picks.map(p => `${p.qid}:${p.opt}`).join(',');
    if (world.propsKey === key) return; // 바뀐 경우에만 다시 그린다
    world.propsKey = key;
    $('#props').innerHTML = picks.map((p, k) => {
      const sh = pickView(p).o.show || {}, i = world.stages.findIndex(x => x.id === p.stageId);
      if (!sh.prop || i < 0) return '';
      return `<g class="${popLatest && k === picks.length - 1 ? 'prop-new' : ''}">${A.prop(sh.prop, world.xs[i] + RES_X + 330, BASE)}</g>`;
    }).join('');
  }
  function place(x, cam, lane) {
    view.x = x; view.cam = cam; view.lane = lane;
    $('#main').setAttribute('transform', `translate(${-cam} 0)`);
    $('#far').setAttribute('transform', `translate(${-cam * .12} 0)`);
    $('#mid').setAttribute('transform', `translate(${-cam * .35} 0)`);
    $('#fg').setAttribute('transform', `translate(${-cam * 1.2} 0)`);
    $('#clouds').setAttribute('transform', `translate(${-cam * .04} 0)`);
    const y = laneY(x, lane);
    $('#me').setAttribute('transform', `translate(${x} ${y})`);
    $('#partner').setAttribute('transform', `translate(${x + PARTNER_DX} ${laneY(x + PARTNER_DX, lane)})`);
    $('#kid').setAttribute('transform', `translate(${x + KID_DX} ${laneY(x + KID_DX, lane)})`);
    document.querySelectorAll('#friends .fr').forEach(f => { const dx = +f.dataset.dx; f.setAttribute('transform', `translate(${x + dx} ${laneY(x + dx, lane)})`); });
    const head = 152 * ({ child: .7, teen: .88, young: .97, adult: 1, middle: .99, senior: .95 })[A.lifeStage(view.age)];
    $('#bubble').setAttribute('transform', `translate(${x + 6} ${y - head - 62})`);
  }
  function setPose(p, s) {
    view.age = p.age; drawSky(p.age); drawPeople(p.age, s); place(p.x, p.cam, p.lane);
    stride(false);
  }
  function stride(on) {
    const el = $('#people');
    el.setAttribute('class', on ? 'walking' : 'idle');
    if (!on) { el.style.setProperty('--sw', '0'); el.style.setProperty('--bob', '0'); }
  }
  function stepCycle() {
    const ph = performance.now() / 1000 * Math.PI * 2, el = $('#people');
    el.style.setProperty('--sw', Math.sin(ph).toFixed(3));
    el.style.setProperty('--bob', Math.abs(Math.sin(ph)).toFixed(3));
  }
  function showBubble(item, optIdx) {
    if (!item) { $('#bubble').innerHTML = ''; return; }
    const c = OPT[optIdx].c;
    $('#bubble').innerHTML = `<g class="bub"><path d="M0 34 -10 22h20Z" fill="#fff"/><circle r="40" fill="#fff" stroke="${c}" stroke-width="5"/>${A.iconAt(item, 0, 0, 44, c)}</g>`;
  }

  // ---------- 애니메이션 ----------
  let anim = null;
  function animate(dur, frame, done) {
    finish();
    const t0 = performance.now(), me = { frame, done, raf: 0 };
    anim = me;
    const step = now => {
      if (anim !== me) return;
      const t = clamp((now - t0) / dur, 0, 1);
      frame(t);
      if (t < 1) me.raf = requestAnimationFrame(step); else { anim = null; done && done(); }
    };
    me.raf = requestAnimationFrame(step);
  }
  function finish() { if (!anim) return; const a = anim; anim = null; cancelAnimationFrame(a.raf); a.frame(1); a.done && a.done(); }
  const speed = () => settings.fast ? .55 : 1;

  function walk(prev, next) {
    const from = poseOf(prev), to = poseOf(next);
    const dist = Math.abs(to.x - from.x), dur = clamp(dist / 640, 1.3, 3.4) * 1000 * speed();
    const target = next.phase === 'fork' ? E.stageAt(C, next, next.i) : null;
    ui.moving = true; renderUI();
    stride(true);
    showBubble(null);
    const cap = $('#caption');
    if (target || next.phase === 'ending') {
      cap.innerHTML = target ? `<div class="cap-age">${target.age}세</div><div class="cap-era">${esc(target.era)}</div>` : `<div class="cap-age">${C.endingAge}세</div><div class="cap-era">돌아보는 삶</div>`;
    } else cap.innerHTML = '';
    animate(dur, t => {
      const e = easeInOut(t), age = lerp(from.age, to.age, smooth(t * 1.15));
      view.age = age; drawSky(age); drawPeople(age, next, true);
      place(lerp(from.x, to.x, e), lerp(from.cam, to.cam, e), 0); stepCycle();
      renderAge(Math.round(age), target ? target.era : next.phase === 'ending' ? '돌아보는 삶' : null);
      cap.classList.toggle('show', !!cap.innerHTML && t > .12 && t < .86);
    }, () => {
      cap.classList.remove('show');
      ui.moving = false; setPose(to, next); renderUI(); afterArrive(prev, next);
      if (next.phase === 'event') Sound.play('card');
    });
  }
  function moveThrough(prev, next) {
    const i = prev.i, X = world.xs[i], opt = next.picks.at(-1).opt, lane = opt === 0 ? -1 : 1;
    const from = poseOf(prev), to = poseOf(next), o = E.question(C, next).options[opt];
    const giveShow = E.optionView(E.question(C, next), opt, next.picks.at(-1).ev || []).show || {};
    ui.give = giveShow.give ? { stage: 'before' } : null;
    ui.moving = true; ui.highlight = opt; renderUI(); renderGates(prev, opt);
    stride(true);
    let passed = false;
    const dur = 2900 * speed();
    animate(dur, t => {
      const e = easeInOut(t), x = lerp(from.x, to.x, e);
      place(x, lerp(from.cam, to.cam, e), lane); stepCycle();
      if (!passed && x >= X + GATE - 10) {
        passed = true;
        const g = $(`#gates .gate[data-fork="${i}"][data-key="${OPT[opt].key}"]`); g && g.classList.add('passed');
        showBubble(o.item, opt);
        drawPeople(view.age, next, true);
        renderProps(next, true);
        const sh = E.optionView(E.question(C, next), opt, next.picks.at(-1).ev || []).show || {};
        Sound.play(sh.sound || 'gate'); if (sh.sound) Sound.play('gate');
        if (sh.confetti) { confetti(); Sound.play('confetti'); }
        if (sh.sound === 'page' || sh.sound === 'laugh') floatWord(sh.sound === 'page' ? '사락사락' : '깔깔깔', OPT[opt].c);
      }
    }, () => {
      ui.moving = false; setPose(to, next); showBubble(o.item, opt); renderUI(); afterArrive(prev, next);
      if (ui.give) setTimeout(() => { if (state === next && ui.give?.stage === 'before') runGive(next); }, 350);
    });
  }
  // 꽃·반지를 천천히 건넨다: 주는 사람이 팔을 내밀고 → 물건이 둥실 날아가고 → 받는 사람 손에 쥐어진다.
  function runGive(s) {
    const g = appearance(s, view.age).give;
    if (!g || !$('#partner').innerHTML) { ui.give = { stage: 'done' }; return; }
    const sc = A.SCALE[A.lifeStage(view.age)], y = laneY(view.x, 0), fromMe = g.from === 'me';
    const meHand = { x: view.x - 27 * sc, y: y - 77 * sc }, pHand = { x: view.x + PARTNER_DX + 27 * sc, y: y - 77 * sc };
    const [a, b] = fromMe ? [meHand, pHand] : [pHand, meHand];
    const fly = $('#fly');
    animate(3400 * speed(), t => {
      if (t >= .24 && ui.give.stage === 'before') { ui.give.stage = 'flying'; drawPeople(view.age, s); fly.innerHTML = `<g class="fly-item">${A.held(g.item)}</g>`; }
      if (ui.give.stage === 'flying') {
        const u = easeInOut(clamp((t - .24) / .56, 0, 1)), big = 1 + .55 * Math.sin(Math.PI * u); // 날아가는 동안 크게 보여 준다
        fly.setAttribute('transform', `translate(${lerp(a.x, b.x, u).toFixed(1)} ${(lerp(a.y, b.y, u) - Math.sin(Math.PI * u) * 70).toFixed(1)}) scale(${(sc * big).toFixed(3)}) translate(0 60)`);
      }
      if (t >= .8 && ui.give.stage === 'flying') {
        ui.give.stage = 'done'; fly.innerHTML = ''; drawPeople(view.age, s); Sound.play('give');
        hearts((a.x + b.x) / 2, Math.min(a.y, b.y) - 30);
      }
    }, () => { if (ui.give && ui.give.stage !== 'done') { ui.give.stage = 'done'; drawPeople(view.age, s); } fly.innerHTML = ''; });
  }
  function hearts(wx, wy) {
    for (let k = 0; k < 5; k++) {
      const el = document.createElement('div'); el.className = 'heart-float';
      el.innerHTML = A.icon('heart'); el.style.left = `${wx - view.cam - 18 + (k - 2) * 22}px`; el.style.top = `${wy}px`; el.style.animationDelay = `${k * .12}s`;
      $('#fx').appendChild(el); setTimeout(() => el.remove(), 2400);
    }
  }
  function confetti() {
    const cols = ['#f7c5cc', '#ffffff', '#ffe08a', '#f2a7b5', '#cfc6ff'];
    for (let k = 0; k < 36; k++) {
      const el = document.createElement('i'); el.className = 'petal';
      el.style.left = `${view.x - view.cam - 160 + Math.random() * 360}px`; el.style.top = `${120 + Math.random() * 120}px`;
      el.style.background = cols[k % cols.length]; el.style.animationDelay = `${Math.random() * .5}s`; el.style.setProperty('--dx', `${(Math.random() - .5) * 220}px`);
      $('#fx').appendChild(el); setTimeout(() => el.remove(), 2600);
    }
  }
  function floatWord(text, color) {
    const el = document.createElement('div'); el.className = 'float word'; el.style.setProperty('--dc', color);
    el.style.left = `${view.x - view.cam - 120}px`; el.style.top = `${laneY(view.x, view.lane) - 250}px`; el.textContent = text;
    $('#fx').appendChild(el); setTimeout(() => el.remove(), 2200);
  }
  function afterArrive(prev, next) {
    if (next.last?.effects && next !== prev) showDeltas(next.last.effects, next.phase === 'result');
  }
  function showDeltas(effects, overHead) {
    let k = 0;
    for (const d of C.dimensions) {
      const v = effects[d.key]; if (!v) continue;
      const row = $(`#gauges .g-row[data-k="${d.key}"]`);
      if (row) { row.querySelector('.g-delta')?.remove(); row.insertAdjacentHTML('beforeend', `<span class="g-delta" style="--dc:${d.color}">${v > 0 ? '+' : '−'}${Math.abs(v)}</span>`); }
      if (overHead) {
        const el = document.createElement('div');
        el.className = 'float'; el.style.setProperty('--dc', d.color);
        el.style.left = `${view.x - view.cam + 120}px`; el.style.top = `${laneY(view.x, view.lane) - 210 + k * 46}px`;
        el.style.animationDelay = `${k * 0.18}s`;
        el.textContent = `${v > 0 ? '+' : '−'}${Math.abs(v)} ${d.label}`;
        $('#fx').appendChild(el); setTimeout(() => el.remove(), 2600 + k * 200);
      }
      k++;
    }
  }

  // ---------- 상태 전환 ----------
  function go(next, { record = true } = {}) {
    finish();
    const prev = state;
    if (record) history.push(prev);
    state = next; ui.highlight = null; if (!(prev.phase === 'fork' && next.phase === 'result')) ui.give = null;
    const kind = transition(prev, next);
    if (kind === 'walk') walk(prev, next);
    else if (kind === 'move') moveThrough(prev, next);
    if (kind !== 'walk' && next.phase === 'start') Sound.play('card');
    else { setPose(poseOf(next), next); if (next.phase === 'result') { const p = next.picks.at(-1); showBubble(E.question(C, next).options[p.opt].item, p.opt); } else showBubble(null); renderUI(); afterArrive(prev, next); }
    saveGame();
  }
  function transition(prev, next) {
    const pp = prev.phase, np = next.phase;
    if (pp === 'fork' && np === 'result') return 'move';
    if ((pp === 'title' || pp === 'start') && (np === 'fork' || np === 'event')) return 'walk';
    if ((pp === 'result' || pp === 'event') && ['fork', 'event', 'ending'].includes(np)) return 'walk';
    if (pp === 'fork' && np !== 'result') return 'instant'; // 건너뛰기는 바로 다음 장면으로
    return 'instant';
  }
  function back() {
    if (anim) { finish(); return; }
    if (ui.modal) return closeModal();
    if (!history.length) return toast('처음 장면입니다.');
    state = history.pop(); ui.highlight = null; ui.rewindSel = null; ui.give = null; $('#fly').innerHTML = '';
    if (state.phase === 'title') { startTitle(); return; }
    peopleKey = ''; lastLook = null;
    setPose(poseOf(state), state);
    if (state.phase === 'result') { const p = state.picks.at(-1); showBubble(E.question(C, state).options[p.opt].item, p.opt); } else showBubble(null);
    renderUI(); saveGame(); toast('한 단계 되돌렸어요.');
  }
  function newGame() {
    const seed = (Date.now() ^ (Math.random() * 1e9)) % 2147483647;
    let s;
    try { s = E.newGame(C, settings, seed); } catch (e) { toast(e.message); return; }
    history = [];
    const title = { phase: 'title' };
    buildWorld(s.run.stageIds); peopleKey = '';
    state = title; setPose(poseOf(title), title);
    go(s);
  }
  function primary() {
    if (anim) return finish();
    switch (state.phase) {
      case 'title': return newGame();
      case 'fork': {
        const h = ui.highlight ?? majority();
        if (h == null) return toast('1 또는 2를 눌러 길을 골라 주세요.');
        return go(E.choose(C, state, h));
      }
      case 'ending':
        if (onRewindList()) { if (!ui.rewindSel) return toast('바꾸고 싶은 갈림길을 골라 주세요 (↑↓ 또는 클릭).'); const id = ui.rewindSel; ui.rewindSel = null; return go({ ...state, rewindPick: id }); }
        if (state.page >= endingPages().length - 1) return toast('R: 처음 화면으로 · ←: 이전 장면'); return go(E.next(C, state));
      default: return go(E.next(C, state));
    }
  }
  const lockAt = k => state.phase === 'fork' ? E.lockOf(E.question(C, state), k, state.flags) : null;
  const openOnly = () => lockAt(0) ? 1 : lockAt(1) ? 0 : null;
  function majority() { const o = openOnly(); if (o != null) return o; const v = state.votes?.[E.stageAt(C, state, state.i).id]; if (!v || v[0] === v[1]) return null; return v[0] > v[1] ? 0 : 1; }
  function pickOption(k) {
    if (state.phase !== 'fork' || anim) return;
    if (lockAt(k)) { Sound.play('lock'); return toast(`닫힌 길이에요: ${lockAt(k)}`); }
    go(E.choose(C, state, k));
  }
  function nudge(k) {
    if (state.phase !== 'fork' || anim) return;
    if (lockAt(k)) { Sound.play('lock'); return toast(`닫힌 길이에요: ${lockAt(k)}`); }
    if (ui.highlight === k) return pickOption(k);
    ui.highlight = k; renderPanel(); renderGates(state);
  }

  // ---------- UI 그리기 ----------
  function renderUI() {
    const ph = state.phase;
    $('#title').hidden = ph !== 'title';
    $('#hud').hidden = ph === 'title' || (ph === 'ending' && !ui.moving);
    $('#gauges').hidden = !settings.gauges;
    if (ph === 'title') renderTitle();
    renderHud(); renderPanel(); renderCard(); renderEnding(); renderGates(state); renderProps(state); renderNotes(); renderToolbar();
  }
  function renderTitle() {
    const n = E.activeStages(C, settings).length;
    const mins = Math.round(n * 2.6 + (settings.events ? 2 : 0) + 4);
    $('#title').innerHTML = `<div class="t-sub">${esc(C.subtitle)}</div><h1 class="t-title">${esc(C.title)}</h1><p class="t-tag">${esc(C.tagline)}</p>
      <ul class="t-rules">${(present() ? C.intro.rules : C.intro.rulesSolo || C.intro.rules).map((t, k) => `<li><i>${A.icon(['skip', present() ? 'vote' : 'heart', 'dice'][k] || 'star')}</i>${esc(t)}</li>`).join('')}</ul>
      <div class="t-actions"><button class="btn primary" data-act="start">${A.icon('play')} 시작하기 <span class="kbd">Space</span></button>
      ${savedGame ? `<button class="btn" data-act="resume">${A.icon('replay')} 이어하기 <span class="kbd">C</span></button>` : ''}
      ${present() ? `<button class="btn" data-act="settings" title="설정 (S)">${A.icon('gear')} 설정</button>` : ''}<button class="btn" data-act="help" title="조작법 (H)">${A.icon('help')} 조작법</button></div>
      ${present() ? `<div class="t-status"><span class="mode on">발표 모드</span><span>갈림길 ${n}개 · 약 ${mins}분</span><span>${settings.votes ? '반 투표 켜짐' : '반 투표 꺼짐'}</span><span>${settings.startCards ? '출발 카드' : '출발 카드 없음'}</span><span>${settings.events ? '운명 카드' : '운명 카드 없음'}</span></div>` : ''}`;
  }
  function renderHud() {
    if (state.phase === 'title') return;
    const scale = E.gaugeScale(C, state);
    const g = $('#gauges');
    if (!g.querySelector('.g-row')) g.innerHTML = `<div class="g-head"><span>내 삶을 채운 것들</span><span class="kbd">G</span></div>` + C.dimensions.map(d => `<div class="g-row" data-k="${d.key}" style="--dc:${d.color}">${A.icon(d.icon)}<b>${esc(d.label)}</b><div class="g-bar"><div class="g-fill" style="width:0"></div></div></div>`).join('');
    for (const d of C.dimensions) { const f = g.querySelector(`.g-row[data-k="${d.key}"] .g-fill`); if (f) f.style.width = `${clamp(state.gauges[d.key] / scale, 0, 1) * 100}%`; }
    // 인생 타임라인
    const ids = state.run.stageIds, picks = Object.fromEntries(state.picks.map(p => [p.stageId, p]));
    const cur = ['fork', 'result'].includes(state.phase) ? state.i : -1;
    const passed = k => state.phase === 'ending' || k < state.i || (k === state.i && state.phase === 'result');
    $('#timeline').innerHTML = ids.map((id, k) => {
      const s = C.stages.find(x => x.id === id), p = picks[id];
      if (p && passed(k)) { const o = pickView(p).o; return `<div class="t-node done${k === cur ? ' current-done' : ''}" style="--c:${OPT[p.opt].c}"><div class="t-dot">${A.icon(o.item)}</div><div class="t-age">${s.age}세</div></div>`; }
      if (passed(k)) return `<div class="t-node skipped"><div class="t-dot">–</div><div class="t-age">${s.age}세</div></div>`;
      if (k === cur) return `<div class="t-node current"><div class="t-dot">${s.age}</div><div class="t-age">${s.age}세</div></div>`;
      return `<div class="t-node"><div class="t-dot"></div><div class="t-age">${s.age}세</div></div>`;
    }).join('') + `<div class="t-node end"><div class="t-dot">${A.icon('star')}</div><div class="t-age">${C.endingAge}세</div></div>`;
    const s = ['fork', 'result'].includes(state.phase) ? E.stageAt(C, state, state.i) : null;
    renderAge(Math.round(view.age), s ? s.era : state.phase === 'start' ? '출발' : state.phase === 'event' ? (present() ? '운명의 순간' : '그 무렵') : null);
  }
  function renderAge(age, era) {
    $('#agebadge').innerHTML = `<div class="age-era">${era ? esc(era) : '인생 산책 중'}</div><div class="age-num">${age}<small>세</small></div>`;
  }
  function effectChips(eff) {
    return C.dimensions.filter(d => eff?.[d.key]).map(d => { const v = eff[d.key]; return `<span class="chip ${v < 0 ? 'neg' : ''}" style="--dc:${d.color}">${A.icon(d.icon)}${esc(d.label)} ${v > 0 ? '+' : '−'}${Math.abs(v)}</span>`; }).join('');
  }
  function renderPanel() {
    const p = $('#panel'), ph = state.phase;
    if (ui.moving || !['fork', 'result'].includes(ph)) { p.hidden = true; return; }
    const s = E.stageAt(C, state, state.i), q = E.question(C, state);
    p.hidden = false;
    p.classList.toggle('res', ph === 'result');
    if (ph === 'fork') {
      const v = state.votes?.[s.id], total = v ? v[0] + v[1] : 0, hl = ui.highlight ?? majority(), only = openOnly();
      const opts = [0, 1].map(k => E.optionView(q, k, state.flags)), evQ = E.isEventQuestion(q);
      const evCtx = !evQ && (q.contextIf || []).some(ci => (ci.when || []).some(f => f.startsWith('ev-')) && E.matches(ci.when, state.flags));
      const hint = only != null ? `${A.icon('lock')}${present() ? '운명 카드 때문에 ' : '이번엔 '}한 길만 열려 있어요 · <span class="kbd">Space</span>로 계속`
        : votesOn() ? `${A.icon('vote')}다 같이 손을 들어 골라 주세요 · <span class="kbd">V</span> 손 든 사람 수 입력` : `<span class="kbd">1</span> <span class="kbd">2</span> 또는 문을 눌러 고르기`;
      p.innerHTML = `<div><span class="tag">${A.icon('clock')} ${s.age}세 · ${esc(s.era)}</span>${present() && (evQ || evCtx) ? `<span class="tag ev">${A.icon('dice')} ${evQ ? '운명 카드로 바뀐 질문' : '운명 카드로 달라진 상황'}</span>` : ''}<h2 class="q-title">${esc(q.title)}</h2><p class="q-context">${esc(E.contextOf(q, state.flags))}</p>
        <div class="hint">${hint}</div></div>
        <div class="options">${opts.map((o, k) => `<button class="opt ${hl === k ? 'hl' : ''} ${o.locked ? 'locked' : ''}" data-opt="${k}" style="--c:${OPT[k].c};--cs:${OPT[k].cs};--cg:${OPT[k].cg}"><span class="key">${o.locked ? A.icon('lock') : `${k + 1}<small>${OPT[k].arrow}</small>`}</span><span><strong>${esc(o.title)}</strong><span class="d">${o.locked ? `닫힌 길 · ${esc(o.locked)}` : esc(o.desc)}</span></span>${present() && o.changed && !o.locked ? `<span class="ev-chip">${A.icon('dice')} 운명 카드로 달라짐</span>` : ''}${total && !o.locked ? `<span class="vote">${v[k]}명 · ${Math.round(v[k] / total * 100)}%</span><span class="vote-bar" style="width:${v[k] / total * 100}%"></span>` : ''}</button>`).join('')}</div>
        ${votesOn() && only == null ? `<button class="pill-btn vote-btn" data-act="vote">${A.icon('vote')} 투표 수 입력 <span class="kbd">V</span></button>` : ''}
        ${history.length ? `<button class="pill-btn minor" data-act="back">${A.icon('back')} 되돌리기</button>` : ''}`;
    } else {
      const pk = state.picks.at(-1), o = E.optionView(q, pk.opt, pk.ev || []), k = pk.opt, con = q.concept;
      const fate = !present() ? '' : pk.forced ? '운명 카드 때문에 다른 길이 닫혀 이 길로 왔다' : pk.changed ? '운명 카드가 이 길의 모습을 바꿨다' : '';
      const last = state.i === state.run.stageIds.length - 1 && !state.run.events[state.run.stageIds.length];
      p.innerHTML = `<div><span class="chosen" style="--c:${OPT[k].c};--cs:${OPT[k].cs}"><i>${k + 1}</i>${esc(o.title)}</span>${fate ? `<span class="fate">${A.icon('dice')} ${fate}</span>` : ''}<h2 class="r-head">${esc(o.gain)}</h2><p class="r-text">${esc(o.result)}</p></div>
        <div><div class="effects">${effectChips(o.effects)}</div><p class="cost"><b>아쉬운 점</b>${esc(o.cost)}</p>
        <div class="reflect"><span>${present() ? '함께 생각해 봐요' : '잠깐 생각해 보기'}</span><p>${esc(q.reflection)}</p></div>
        ${con && present() ? `<div class="concept"><em class="k-${esc(con.kind)}">${esc(con.kind === '수업' ? '수업 연결' : con.kind)}</em>${esc(con.label)}</div>` : ''}</div>
        <button class="pill-btn next" data-act="next">${last ? '삶을 돌아보기' : '다음 시기로'} ${A.icon('arrow')} <span class="kbd">Space</span></button>
        <button class="pill-btn minor" data-act="back">${A.icon('back')} 다시 고르기</button>`;
    }
  }
  function renderCard() {
    const el = $('#card'), ph = state.phase;
    if (ui.moving || (ph !== 'start' && ph !== 'event')) { el.hidden = true; return; }
    el.hidden = false;
    const isStart = ph === 'start', card = isStart ? C.starts.cards.find(c => c.id === state.run.startId) : C.events.cards.find(c => c.id === state.eventId);
    const label = present() ? `${isStart ? C.starts.label : `${C.events.label} · ${E.ageOf(C, state)}세 무렵`}` : isStart ? C.starts.labelSolo || '나의 출발' : `${E.ageOf(C, state)}세 무렵`;
    el.innerHTML = `<div class="card-inner ${isStart ? 'start' : ''}"><div class="c-label">${A.icon(isStart ? 'house' : 'dice')} ${esc(label)}</div>
      <div class="c-icon">${A.icon(card.icon)}</div><h2 class="c-title">${esc(card.title)}</h2><p class="c-text">${esc(card.text)}</p>
      <div class="effects">${effectChips(card.effects)}</div>${present() && !isStart && E.eventAffectsNext(C, state) ? `<p class="c-next">${A.icon('arrow')} 바로 다음 갈림길이 달라져요</p>` : ''}<p class="c-reflect">“${esc(isStart ? C.starts.reflection : card.reflection)}”</p>
      <div class="c-actions"><button class="btn primary" data-act="next">${isStart ? '길을 나서기' : '계속 걷기'} ${A.icon('arrow')} <span class="kbd">Space</span></button></div></div>`;
  }
  // 체험 모드(각자 플레이)는 의도를 숨기고, 발표 모드는 하나 바꾸기·같은 크기의 원·마무리까지 보여 준다.
  function endingPages() {
    if (!present()) return ['result', 'outro'];
    const sum = E.summary(C, state);
    return ['result', 'rewind', 'path', ...(sum.voted.length ? ['votes'] : []), 'types', 'closing'];
  }
  function renderMemories() {
    const g = $('#memories');
    if (ui.moving || state.phase !== 'ending') { g.innerHTML = ''; return; }
    const key = state.picks.map(p => `${p.qid}:${p.opt}`).join(',');
    if (g.dataset.key === key && g.innerHTML) return;
    g.dataset.key = key;
    const items = state.picks.map(p => ({ item: pickView(p).o.item, c: OPT[p.opt].c }));
    const n = items.length, cx = view.x - 60, cy = 330;
    g.innerHTML = items.map((it, k) => {
      const a = Math.PI * (1.1 + .8 * (n === 1 ? .5 : k / (n - 1))), x = cx + Math.cos(a) * 285, y = cy + Math.sin(a) * 175;
      return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><g class="bub" style="animation-delay:${(k * .12).toFixed(2)}s"><circle r="34" fill="#fff" stroke="${it.c}" stroke-width="5"/>${A.iconAt(it.item, 0, 0, 36, it.c)}</g></g>`;
    }).join('');
  }
  // 엔딩 도넛: 누구의 원이든 크기는 같고, 무엇으로 채웠는지 비율만 다르다.
  // 순서는 고정(성장→안정→즐거움→관계). 이웃한 색이 색각 이상에서도 구분되도록 검증한 순서다.
  const DONUT_ORDER = ['growth', 'ease', 'passion', 'connection'];
  function percents(values) {
    const total = values.reduce((a, b) => a + b, 0) || 1, raw = values.map(v => v / total * 100), out = raw.map(Math.floor);
    raw.map((v, k) => [v - out[k], k]).sort((a, b) => b[0] - a[0]).slice(0, 100 - out.reduce((a, b) => a + b, 0)).forEach(([, k]) => out[k]++);
    return out;
  }
  const donutDims = () => [...DONUT_ORDER.map(k => C.dimensions.find(d => d.key === k)).filter(Boolean), ...C.dimensions.filter(d => !DONUT_ORDER.includes(d.key))];
  // 도넛 하나 (SVG). center: [작은 글, 큰 글]
  function ring(gauges, { R = 108, w = 50, center = null, cls = '' } = {}) {
    const dims = donutDims(), pct = percents(dims.map(d => gauges[d.key] || 0)), gap = 3 / (2 * Math.PI * R) * 100, box = R + w / 2 + 4;
    let off = 0;
    const segs = dims.map((d, k) => {
      const len = pct[k], g = len > gap * 3 ? gap : 0, s = `<circle r="${R}" pathLength="100" fill="none" stroke="${d.color}" stroke-width="${w}" stroke-dasharray="${(len - g).toFixed(2)} ${(100 - len + g).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90)" style="animation-delay:${k * .12}s"><title>${esc(d.label)} ${len}%</title></circle>`;
      off += len; return len ? s : '';
    }).join('');
    const mid = center ? `<text y="-${R * .13}" text-anchor="middle" class="d-k">${esc(center[0])}</text><text y="${R * .24}" text-anchor="middle" class="d-v ${center[1].length > 4 ? 'tie' : ''}">${esc(center[1])}</text>` : '';
    return { pct, dims, svg: `<svg class="ring ${cls}" viewBox="${-box} ${-box} ${box * 2} ${box * 2}" role="img" aria-label="${dims.map((d, k) => `${esc(d.label)} ${pct[k]}%`).join(', ')}"><circle r="${R}" fill="none" stroke="#efe8d8" stroke-width="${w}"/>${segs}${mid}</svg>` };
  }
  function donut(sum) {
    const { pct, dims, svg } = ring(sum.gauges, { center: ['가장 많이 채운 것', sum.tops.map(d => d.label).join(' · ')] });
    return `<div class="e-donut">${svg}
      <div class="e-leg">${dims.map((d, k) => `<div class="${sum.tops.includes(d) ? 'top' : ''}"><i style="background:${d.color}"></i><span style="color:${d.color}">${A.icon(d.icon)}</span><b>${esc(d.label)}</b><em>${pct[k]}%</em></div>`).join('')}${present() ? `<p>${esc(C.ending.donutCaption)}</p>` : ''}</div></div>`;
  }
  // 이번 판에서 나올 수 있는 모든 결말을 엔딩별로 평균 낸 비율 (발표 모드 '다섯 가지 삶')
  let typesCache = null;
  function typeAverages() {
    const key = JSON.stringify([state.run, state.seed, state.skipped]);
    if (typesCache?.key === key) return typesCache.v;
    const acc = {};
    for (const s of E.enumerate(C, state)) {
      const t = E.typeOf(C, s.gauges), tot = Object.values(s.gauges).reduce((a, b) => a + b, 0) || 1, a = acc[t] || (acc[t] = { n: 0, g: {} });
      a.n++; for (const [k, v] of Object.entries(s.gauges)) a.g[k] = (a.g[k] || 0) + v / tot;
    }
    typesCache = { key, v: acc }; return acc;
  }
  function renderEnding() {
    const el = $('#ending');
    renderMemories();
    if (ui.moving || state.phase !== 'ending') { el.hidden = true; return; }
    el.hidden = false;
    const sum = E.summary(C, state), pages = endingPages(), page = pages[clamp(state.page, 0, pages.length - 1)];
    let html = '';
    if (page === 'outro') {
      const o = C.ending.outro;
      html = `<div class="e-kicker">${C.endingAge}세 · 당신의 엔딩</div><div class="e-persona">${esc(sum.profile.persona || '')}</div><h2 class="e-title">${esc(sum.profile.title)}</h2><div class="e-outro">${A.icon('star')}<div><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p></div></div>`;
    } else if (page === 'rewind') {
      html = rewindPage(sum);
    } else if (page === 'types') {
      const tp = C.ending.types, avg = typeAverages(), order = [...C.dimensions.map(d => d.key), 'balance'];
      html = `<div class="e-kicker">이번 판에서 나올 수 있었던 ${Object.values(avg).reduce((a, b) => a + b.n, 0).toLocaleString()}가지 삶</div><h2 class="e-h2">${esc(tp.title)}</h2><p class="e-cap">${esc(tp.caption)}</p>
        <div class="e-types">${order.map(k => { const a = avg[k], prof = C.ending.profiles[k], g = a ? Object.fromEntries(Object.entries(a.g).map(([x, v]) => [x, v / a.n])) : {}; return `<div class="${k === sum.type ? 'mine' : ''} ${a ? '' : 'none'}">${a ? ring(g, { R: 70, w: 34 }).svg : '<svg class="ring" viewBox="-108 -108 216 216"><circle r="70" fill="none" stroke="#efe8d8" stroke-width="34"/></svg>'}<b>${esc(prof.persona || prof.title)}</b><small>${a ? `${Math.round(a.n / Object.values(avg).reduce((x, y) => x + y.n, 0) * 100)}%의 삶` : '이번 판엔 없음'}${k === sum.type ? ' · 나의 엔딩' : ''}</small></div>`; }).join('')}</div>`;
    } else if (page === 'result') {
      html = `<div class="e-kicker">${C.endingAge}세 · ${esc(C.ending.intro)}</div><div class="e-persona">${esc(sum.profile.persona || '')}</div><h2 class="e-title">${esc(sum.profile.title)}</h2><p class="e-body">${esc(sum.profile.body)}</p>
        ${donut(sum)}
        ${present() ? `<p class="e-low">${esc(C.ending.lowest.replace('{label}', sum.low.label))}</p>` : ''}`;
    } else if (page === 'path') {
      const rn = C.ending.roadNotTaken;
      html = `<div class="e-kicker">${esc(rn.source)}</div><h2 class="e-h2">${esc(rn.title)}</h2><p class="e-cap">${esc(rn.caption)}</p>
        <div class="e-path ${sum.path.length > 8 ? 'dense' : ''} ${sum.path.length > 10 ? 'denser' : ''}"><div class="e-row head"><span></span><span>고른 길</span><span>가지 않은 길 · 얻을 수도 있었던 것</span></div>${sum.path.map(p => `<div class="e-row"><div class="age">${p.stage.age}<small>${esc(p.stage.era)}</small></div><div class="took"><i style="--c:${OPT[p.opt].c}">${A.icon(p.chosen.item)}</i>${esc(p.chosen.title)}</div><div class="not"><b>${esc(p.other.title)}</b><span>${p.forced ? `닫혀 있던 길 · ${esc(p.other.locked || '')}` : esc(p.other.gain)}</span></div></div>`).join('')}</div>`;
    } else if (page === 'votes') {
      const vt = C.ending.votes;
      html = `<div class="e-kicker">우리 반 ${sum.voted.length}번의 투표</div><h2 class="e-h2">${esc(vt.title)}</h2><p class="e-cap">${esc(vt.caption)}</p>
        <div class="e-votes ${sum.voted.length > 5 ? 'dense' : ''} ${sum.voted.length > 8 ? 'denser' : ''}">${sum.voted.map(p => { const [a, b] = p.votes, t = a + b; return `<div class="e-vote ${p === sum.split ? 'split' : ''}"><header><span>${p.stage.age}세 · ${esc(p.question.title)}</span>${p === sum.split ? '<small>가장 팽팽했던 질문</small>' : ''}</header><div class="vbar"><span class="va" style="width:${a / t * 100}%">${a ? `${p.opt === 0 ? '✓ ' : ''}${esc(p.question.options[0].gate)} ${a}` : ''}</span><span class="vb" style="width:${b / t * 100}%">${b ? `${b} ${esc(p.question.options[1].gate)}${p.opt === 1 ? ' ✓' : ''}` : ''}</span></div></div>`; }).join('')}</div>`;
    } else {
      const cl = C.ending.closing;
      html = `<div class="e-kicker">${esc(cl.credits)}</div><h2 class="e-h2">${esc(cl.title)}</h2><p class="e-closing">${esc(cl.text)}</p><ol class="e-disc">${cl.discussion.map(d => `<li>${esc(d)}</li>`).join('')}</ol><div class="e-credit">${esc(cl.source)}</div>`;
    }
    const lastPage = state.page >= pages.length - 1;
    el.innerHTML = `<div class="e-page" data-page="${page}">${html}</div><div class="e-nav"><div class="e-dots">${pages.map((_, k) => `<i class="${k === state.page ? 'on' : ''}"></i>`).join('')}</div><div class="btns">${lastPage ? `<button class="btn" data-act="restart">${A.icon('replay')} 처음 화면 <span class="kbd">R</span></button><button class="btn primary" data-act="replay">${A.icon('play')} 다시 살아 보기</button>` : `<button class="btn primary" data-act="next">다음 ${A.icon('arrow')} <span class="kbd">Space</span></button>`}</div></div>`;
  }
  // 하나만 다시 고르기: 목록 → 고르면 두 도넛 비교
  function rewindPage(sum) {
    const rw = C.ending.rewind;
    if (!state.rewindPick) {
      const sel = ui.rewindSel;
      return `<div class="e-kicker">딱 한 번의 기회</div><h2 class="e-h2">${esc(rw.title)}</h2><p class="e-cap">${esc(rw.caption)} <span class="kbd">↑</span><span class="kbd">↓</span> 고르고 <span class="kbd">Enter</span></p>
        <div class="e-path pick ${sum.path.length > 8 ? 'dense' : ''} ${sum.path.length > 10 ? 'denser' : ''}">${sum.path.map(p => `<button class="e-row ${sel === p.stage.id ? 'sel' : ''} ${p.forced ? 'off' : ''}" data-rewind="${p.stage.id}" ${p.forced ? 'disabled' : ''}><div class="age">${p.stage.age}<small>${esc(p.stage.era)}</small></div><div class="took"><i style="--c:${OPT[p.opt].c}">${A.icon(p.chosen.item)}</i>${esc(p.chosen.title)}</div><div class="not"><b>${p.forced ? '닫혀 있던 길이라 바꿀 수 없어요' : `→ ${esc(p.other.title)}`}</b></div></button>`).join('')}</div>`;
    }
    const alt = E.rerun(C, state, state.rewindPick), altSum = E.summary(C, alt), ov = Math.round(E.overlap(state.gauges, alt.gauges) * 100);
    const p = sum.path.find(x => x.stage.id === state.rewindPick);
    const diff = C.dimensions.map(d => [d, alt.gauges[d.key] - state.gauges[d.key]]).filter(([, v]) => v);
    const later = alt.picks.filter(x => x.stageId !== state.rewindPick && state.picks.find(y => y.stageId === x.stageId)?.qid !== x.qid).length;
    return `<div class="e-kicker">${p.stage.age}세 · ${esc(p.chosen.title)} → ${esc(p.other.title)}</div><h2 class="e-h2">${esc(rw.overlap.replace('{pct}', ov))}</h2>
      <div class="e-compare"><div>${ring(state.gauges, { R: 92, w: 42, center: ['지금의 삶', sum.profile.persona ? sum.tops.map(d => d.label).join(' · ') : ''] }).svg}<b>지금의 삶</b><small>${esc(sum.profile.title)}</small></div>
        <div class="arrow">${A.icon('arrow')}</div>
        <div>${ring(alt.gauges, { R: 92, w: 42, center: ['그 길을 골랐다면', altSum.tops.map(d => d.label).join(' · ')] }).svg}<b>그 길을 골랐다면</b><small>${esc(altSum.profile.title)}${altSum.type === sum.type ? ' (같은 엔딩)' : ''}</small></div></div>
      <div class="effects center">${diff.length ? effectChips(Object.fromEntries(diff.map(([d, v]) => [d.key, v]))) : '<span class="chip neg" style="--dc:#77847b">게이지 변화 없음</span>'}</div>
      ${later ? `<p class="e-cap center">이 선택 때문에 뒤에 나오는 질문도 ${later}개 달라졌어요.</p>` : ''}
      <p class="e-closing center">${esc(rw.closing)}</p>`;
  }
  function renderGates(s, chosenNow = null) {
    if (!world) return;
    const picks = s.phase === 'title' ? {} : Object.fromEntries(s.picks.map(p => [p.stageId, p]));
    const fades = {};
    world.xs.forEach((X, i) => {
      let html, key;
      if (s.phase === 'title') { key = '?'; html = unknownGates(X, i); }
      else {
        const id = s.run.stageIds[i], st = C.stages.find(x => x.id === id), p = picks[id];
        const done = s.phase === 'ending' || i < s.i || (i === s.i && s.phase === 'result');
        let q = null, sel = null, cls = ['', ''];
        if (p) { q = st.questions.find(x => x.id === p.qid); sel = p.opt; }
        else if (i === s.i && s.phase === 'fork') q = E.question(C, s);
        if (chosenNow != null && i === s.i) sel = chosenNow;
        if (sel != null && (done || chosenNow != null)) { cls[1 - sel] = 'faded'; fades[i] = 1 - sel; }
        else if (done) { cls = ['faded', 'faded']; fades[i] = 2; }
        else if (i === s.i && s.phase === 'fork' && (ui.highlight ?? majority()) != null) cls[ui.highlight ?? majority()] = 'hl';
        const fl = p ? p.ev || [] : i === s.i && s.phase === 'fork' ? s.flags : [];
        const locks = q ? [0, 1].map(k => !p && !!E.lockOf(q, k, fl)) : [false, false];
        key = q ? `${q.id}|${cls}|${locks}` : '?';
        html = q ? q.options.map((o, k) => gateSvg(X, i, k, o.gate, cls[k], locks[k])).join('') : unknownGates(X, i);
      }
      if (world.gateKeys[i] !== key) { world.gateKeys[i] = key; $(`#gates-${i}`).innerHTML = html; }
    });
    renderRoads(fades);
  }
  function gateSvg(X, i, k, label, cls, locked = false) {
    const y = k === 0 ? ROAD + UP : ROAD + DOWN;
    return A.gate(X + GATE, y, label, OPT[k].key, OPT[k].c, locked, cls === 'faded').replace('<g class="gate', `<g data-fork="${i}" data-opt="${k}" class="${cls} gate`);
  }
  function unknownGates(X, i) { return [0, 1].map(k => gateSvg(X, i, k, '?', '')).join(''); }
  function renderNotes() {
    const el = $('#notes');
    if (!ui.notes) { el.hidden = true; return; }
    el.hidden = false;
    const ph = state.phase; let body = '';
    if (ph === 'title') body = `<p>${esc(C.intro.note)}</p>`;
    else if (ph === 'start') body = `<p>${esc(C.starts.note)}</p>`;
    else if (ph === 'event') { const ev = C.events.cards.find(c => c.id === state.eventId); body = `<p>${esc(C.events.note)}</p><p>${esc(ev.reflection)}</p>`; }
    else if (ph === 'fork' || ph === 'result') {
      const q = E.question(C, state);
      body = `<p>${esc(q.note || '')}</p>${q.concept ? `<div class="n-con"><b>${esc(q.concept.kind)} · ${esc(q.concept.label)}</b>${esc(q.concept.text)}</div>` : ''}${q.sources?.length ? `<div>참고 자료 (LMS 로그인 필요)</div><ul>${q.sources.map(l => `<li>${esc(l.label)}</li>`).join('')}</ul>` : ''}`;
    } else if (ph === 'ending') { const pg = endingPages()[state.page]; body = `<p>${esc(pg === 'rewind' ? C.ending.rewind.note : pg === 'types' ? C.ending.types.note : C.ending.note)}</p>`; }
    el.innerHTML = `<h4><span>발표자 메모</span><span class="kbd">N</span></h4>${body}`;
  }
  function renderToolbar() {
    const tb = $('#toolbar');
    tb.className = state.phase === 'title' || state.phase === 'ending' ? 'top' : '';
    tb.hidden = state.phase === 'ending';
    tb.innerHTML = [...(present() ? [['notes', 'notes', '발표자 메모 (N)', ui.notes]] : []), [settings.sound ? 'sound' : 'mute', 'sound', settings.sound ? '소리 끄기 (M)' : '소리 켜기 (M)'], ...(present() ? [['gear', 'settings', '설정 (S)']] : []), ['help', 'help', '조작법 (H)'], ['expand', 'fullscreen', '전체 화면 (F)']]
      .map(([ic, act, label, on]) => `<button data-act="${act}" class="${on ? 'on' : ''}" title="${label}" aria-label="${label}">${A.icon(ic)}</button>`).join('');
  }

  // ---------- 모달 ----------
  function openModal(kind) {
    finish(); ui.modal = kind;
    const m = $('#modal'); m.hidden = false;
    if (kind === 'help') m.innerHTML = `<div class="m-box"><h2>조작법</h2><p>키보드나 마우스로 진행할 수 있어요.</p><div class="keys">${[
      ['다음 / 결정', 'Space', 'Enter', '→'], ['위 길 고르기', '1', '↑'], ['아래 길 고르기', '2', '↓'], ...(present() ? [['리모컨으로 고르기', '◀ 두 번 = 위', '▶ 두 번 = 아래']] : []),
      ['되돌리기', 'Backspace', '←'], ...(present() ? [['투표 수 입력', 'V'], ['이 갈림길 건너뛰기', 'X'], ['발표자 메모', 'N'], ['설정', 'S'], ['발표 모드 끄기 (첫 화면)', 'Shift+P']] : []), ['게이지 보이기/숨기기', 'G'], ['전체 화면', 'F'],
      ['처음 화면으로', 'R'], ['소리 켜기/끄기', 'M'], ['걷는 중 빨리 감기', 'Space'], ['창 닫기', 'Esc']].map(([l, ...ks]) => `<div><span>${l}</span><span>${ks.map(k => `<span class="kbd">${k}</span>`).join(' ')}</span></div>`).join('')}</div>
      <p style="margin-top:20px">갈림길 화면에서 ← →는 길을 먼저 표시하고, 같은 쪽을 한 번 더 누르면 결정해요. 다른 화면에서 ←는 되돌리기예요.</p><div class="m-actions"><button class="btn primary" data-act="close">닫기 <span class="kbd">Esc</span></button></div></div>`;
    else if (kind === 'settings') renderSettings();
    else if (kind === 'vote') {
      const s = E.stageAt(C, state, state.i), q = E.question(C, state), v = state.votes?.[s.id] || ['', ''];
      m.innerHTML = `<div class="m-box small"><h2>손 든 사람 수</h2><p>${esc(q.title)}</p><form id="vote-form"><div class="vote-grid">${q.options.map((o, k) => `<label style="--c:${OPT[k].c};--cs:${OPT[k].cs}"><b>${k + 1}. ${esc(o.title)}</b><input type="number" min="0" max="999" inputmode="numeric" name="v${k}" value="${v[k]}" placeholder="0"></label>`).join('')}</div>
        <div class="m-actions"><button type="button" class="btn" data-act="close">취소 <span class="kbd">Esc</span></button><button class="btn primary" type="submit">반영 <span class="kbd">Enter</span></button></div></form></div>`;
      const f = $('#vote-form'); f.v0.focus(); f.v0.select();
      f.addEventListener('submit', e => { e.preventDefault(); const a = Math.max(0, parseInt(f.v0.value, 10) || 0), b = Math.max(0, parseInt(f.v1.value, 10) || 0); closeModal(); state = E.setVotes(state, s.id, a, b); ui.highlight = a === b ? null : a > b ? 0 : 1; renderPanel(); renderGates(state); saveGame(); toast(a === b ? '동점이에요. 1 또는 2로 골라 주세요.' : `${a > b ? 1 : 2}번이 더 많아요. Space로 결정!`); });
    } else if (kind === 'confirm') m.innerHTML = `<div class="m-box small"><h2>처음 화면으로 갈까요?</h2><p>지금 진행 중인 이야기는 끝나요. (이어하기로 다시 불러올 수 있어요)</p><div class="m-actions"><button class="btn" data-act="close">취소 <span class="kbd">Esc</span></button><button class="btn primary" data-act="restart-yes">처음으로 <span class="kbd">Enter</span></button></div></div>`;
  }
  function renderSettings() {
    const n = E.activeStages(C, settings).length;
    const tog = (k, label, sub) => `<button class="tog ${settings[k] ? 'on' : ''}" data-tog="${k}"><span class="check">${settings[k] ? A.icon('check') : ''}</span><span>${label}<small>${sub}</small></span></button>`;
    $('#modal').innerHTML = `<div class="m-box"><h2>설정</h2>
      <button class="tog wide ${settings.present ? 'on' : ''}" data-tog="present"><span class="check">${settings.present ? A.icon('check') : ''}</span><span>발표 모드<small>끄면 체험 모드(각자 플레이용): 팀의 의도·수업 연결·반 투표·하나 바꾸기를 숨기고 '발표에서 이어집니다'로 끝나요.</small></span></button>
      <p>켜 둔 시기만 게임에 나와요. 나이대마다 질문 2~3개 중 하나가 무작위로 나와요 (<b>+1</b>은 대신 나올 수 있는 질문 수).</p>
      <div class="set-list">${C.stages.map(s => { const on = settings.stages[s.id]; return `<div class="set-row ${on ? '' : 'off'}" data-stage="${s.id}"><span class="check">${on ? A.icon('check') : ''}</span><span class="age">${s.age}세 · ${esc(s.era)}</span><span class="qs" title="${esc(s.questions.map(q => q.title).join(' / '))}">${esc(s.questions[0].title)}${s.questions.length > 1 ? `<small>+${s.questions.length - 1}</small>` : ''}</span></div>`; }).join('')}</div>
      <div class="set-togs">${tog('votes', '반 투표 (발표 모드)', '손 든 사람 수를 기록해 엔딩에서 보여 줌')}${tog('startCards', '출발 카드', '시작 조건을 무작위로 정함')}${tog('events', '운명 카드', '중간중간 예상 못 한 사건이 생김')}${tog('gauges', '게이지 보이기', '왼쪽 위 4가지 게이지 (G)')}${tog('sound', '소리', '책장·웃음·문 통과 효과음 (M)')}${tog('fast', '빠른 걷기', '이동 애니메이션을 짧게')}</div>
      <div class="m-actions"><span class="m-sum">갈림길 ${n}개 · 예상 약 ${Math.round(n * 2.6 + (settings.events ? 2 : 0) + 4)}분 (투표·토론 포함)</span><button class="btn" data-act="defaults">기본값</button><button class="btn" data-act="close">닫기 <span class="kbd">Esc</span></button><button class="btn primary" data-act="apply">적용하고 처음으로</button></div></div>`;
  }
  function closeModal() { ui.modal = null; $('#modal').hidden = true; $('#modal').innerHTML = ''; }

  // ---------- 기타 ----------
  let toastTimer;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200); }
  function fullscreen() {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch { toast('이 브라우저에서는 전체 화면을 쓸 수 없어요.'); }
  }
  function toggleMode() {
    if (state.phase !== 'title') return;
    settings.present = !settings.present; saveSettings(); closeModal(); renderUI();
    toast(settings.present ? '발표 모드: 팀 의도와 반 투표를 보여 줘요.' : '체험 모드: 각자 플레이용으로 의도를 숨겨요.');
  }
  function rewindMove(d) {
    const rows = E.summary(C, state).path.filter(p => !p.forced).map(p => p.stage.id);
    if (!rows.length) return;
    const i = rows.indexOf(ui.rewindSel);
    ui.rewindSel = rows[i < 0 ? (d > 0 ? 0 : rows.length - 1) : (i + d + rows.length) % rows.length];
    renderEnding();
  }
  const onRewindList = () => state.phase === 'ending' && endingPages()[state.page] === 'rewind' && !state.rewindPick;
  function startTitle() {
    finish(); closeModal();
    const t = { phase: 'title' };
    state = t; history = []; ui.highlight = null;
    const saved = store.get(SAVE_KEY);
    savedGame = saved && saved.rev === REV && saved.state?.phase && !['title', 'ending'].includes(saved.state.phase) ? saved : null;
    buildWorld(E.activeStages(C, settings).map(s => s.id)); peopleKey = '';
    setPose(poseOf(t), t); showBubble(null); $('#gauges').innerHTML = ''; renderUI();
  }
  function resume() {
    if (!savedGame) return;
    state = savedGame.state; history = savedGame.history || [];
    buildWorld(state.run.stageIds); peopleKey = ''; $('#gauges').innerHTML = '';
    setPose(poseOf(state), state);
    if (state.phase === 'result') { const p = state.picks.at(-1); showBubble(E.question(C, state).options[p.opt].item, p.opt); }
    renderUI(); toast('이어서 진행합니다.');
  }
  function act(a) {
    switch (a) {
      case 'start': return newGame();
      case 'resume': return resume();
      case 'next': return primary();
      case 'back': return back();
      case 'vote': return openModal('vote');
      case 'settings': return openModal('settings');
      case 'help': return openModal('help');
      case 'notes': ui.notes = !ui.notes; renderNotes(); renderToolbar(); return;
      case 'fullscreen': return fullscreen();
      case 'close': return closeModal();
      case 'restart': return state.phase === 'ending' ? startTitle() : openModal('confirm');
      case 'restart-yes': return startTitle();
      case 'replay': return newGame();
      case 'defaults': settings = E.defaultSettings(C); return renderSettings();
      case 'apply': saveSettings(); store.del(SAVE_KEY); closeModal(); startTitle(); return toast('설정을 적용했어요.');
      case 'mode': return toggleMode();
      case 'sound': settings.sound = !settings.sound; saveSettings(); renderToolbar(); if (settings.sound) Sound.play('pop'); return toast(settings.sound ? '소리를 켰어요.' : '소리를 껐어요.');
    }
  }

  // ---------- 입력 ----------
  document.addEventListener('click', e => {
    const rw = e.target.closest('[data-rewind]');
    if (rw && !rw.disabled) { if (ui.rewindSel === rw.dataset.rewind) return primary(); ui.rewindSel = rw.dataset.rewind; return renderEnding(); }
    const b = e.target.closest('[data-act],[data-opt],[data-tog],[data-stage]');
    if (!b) { if (anim) finish(); return; }
    if (b.blur) b.blur();
    if (b.dataset.fork != null && (state.phase !== 'fork' || +b.dataset.fork !== state.i)) return;
    if (b.dataset.act) return act(b.dataset.act);
    if (b.dataset.opt != null) return pickOption(+b.dataset.opt);
    if (b.dataset.tog) { settings[b.dataset.tog] = !settings[b.dataset.tog]; saveSettings(); renderToolbar(); return renderSettings(); }
    if (b.dataset.stage) { settings.stages[b.dataset.stage] = !settings.stages[b.dataset.stage]; if (!E.activeStages(C, settings).length) { settings.stages[b.dataset.stage] = true; toast('하나 이상은 켜 두어야 해요.'); } saveSettings(); return renderSettings(); }
  });
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    // 숨은 단축키: 첫 화면에서 Shift+P → 발표 모드 켜기/끄기
    if (e.shiftKey && (k === 'P' || k === 'p')) { e.preventDefault(); if (!ui.modal) toggleMode(); return; }
    if (ui.modal) {
      if (k === 'Escape') { e.preventDefault(); closeModal(); }
      else if (k === 'Enter' && ui.modal === 'confirm') { e.preventDefault(); startTitle(); }
      else if (k === 'Enter' && ui.modal !== 'vote') { e.preventDefault(); closeModal(); }
      return;
    }
    const fork = state.phase === 'fork' && !anim;
    const map = {
      ' ': primary, Enter: primary,
      ArrowRight: () => fork ? nudge(1) : primary(), PageDown: () => fork ? nudge(1) : primary(),
      ArrowLeft: () => fork ? nudge(0) : back(), PageUp: () => fork ? nudge(0) : back(),
      Backspace: back, ArrowUp: () => onRewindList() ? rewindMove(-1) : pickOption(0), ArrowDown: () => onRewindList() ? rewindMove(1) : pickOption(1), 1: () => pickOption(0), 2: () => pickOption(1),
      v: () => { if (state.phase !== 'fork' || !votesOn()) return; if (openOnly() != null) return toast('이번 갈림길은 한 길만 열려 있어요.'); openModal('vote'); },
      m: () => act('sound'), x: () => { if (present() && state.phase === 'fork' && !anim) { go(E.skip(C, state)); toast('이 갈림길은 건너뛰었어요.'); } },
      n: () => present() && act('notes'), g: () => { settings.gauges = !settings.gauges; saveSettings(); $('#gauges').hidden = !settings.gauges || state.phase === 'title'; },
      f: fullscreen, h: () => openModal('help'), '?': () => openModal('help'), s: () => present() && openModal('settings'),
      r: () => state.phase === 'title' ? null : act('restart'), c: () => state.phase === 'title' && resume(),
    };
    const fn = map[k.length === 1 ? k.toLowerCase() : k];
    if (fn) { e.preventDefault(); fn(); }
  });

  // ---------- 시작 ----------
  function boot() {
    fit(); addEventListener('resize', fit);
    const raw = $('#game-content').textContent;
    try { C = E.validate(JSON.parse(raw)); }
    catch (err) {
      $('#stage').insertAdjacentHTML('beforeend', `<div class="error-box"><h1>질문 파일에 문제가 있어요</h1><p>content.json을 고친 뒤 다시 빌드해 주세요.</p><p><code>${esc(err.message)}</code></p></div>`);
      return;
    }
    REV = hash(raw);
    settings = loadSettings();
    document.title = `${C.title} — ${C.subtitle}`;
    startTitle();
    // 레이아웃 점검용 (주소 끝에 #debug 를 붙였을 때만)
    if (/debug/.test(location.hash)) window.__game = { C, E, show(s) { finish(); state = s; buildWorld(s.run.stageIds); peopleKey = ''; lastLook = null; setPose(poseOf(s), s); showBubble(null); renderUI(); }, look: s => appearance(s, E.ageOf(C, s)), get state() { return state; }, settings: () => settings };
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot, boot); else boot();
})();
