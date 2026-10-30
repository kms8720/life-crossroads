// 게임 규칙: 콘텐츠 검증, 진행 상태, 게이지, 운명 카드 효과, 엔딩 계산. 화면 코드와 분리된 순수 함수만 둔다.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LifeEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCENES = ['town', 'school', 'campus', 'library', 'city', 'garden', 'home', 'apartment', 'park'];
  const OPTION_TEXT = { gate: 10, title: 18, desc: 30, gain: 26, cost: 26, result: 120, memory: 80 };

  // ---------- 검증 ----------
  function fail(where, msg) { throw new Error(`${where}: ${msg}`); }
  function str(v, where, max = 400) {
    if (typeof v !== 'string' || !v.trim()) fail(where, '비어 있지 않은 글이 필요합니다.');
    if (v.length > max) fail(where, `${max}자 이하로 줄여 주세요 (지금 ${v.length}자).`);
  }
  function effects(e, keys, where) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) fail(where, 'effects는 {"growth": 2} 같은 객체여야 합니다.');
    for (const [k, v] of Object.entries(e)) {
      if (!keys.includes(k)) fail(where, `effects의 '${k}'는 없는 게이지입니다. (${keys.join(', ')})`);
      if (!Number.isInteger(v) || v < -5 || v > 5) fail(where, `effects 값은 -5~5 사이 정수여야 합니다.`);
    }
  }
  function flagList(v, where) {
    if (v === undefined) return;
    if (!Array.isArray(v) || v.some(f => typeof f !== 'string' || !/^!?[a-z0-9-]+$/.test(f))) fail(where, '조건은 ["parent"] 또는 ["!parent"] 형식이어야 합니다.');
  }
  function links(v, where) {
    if (v === undefined) return;
    if (!Array.isArray(v)) fail(where, 'sources는 배열이어야 합니다.');
    v.forEach((l, i) => { str(l.label, `${where} ${i + 1}번 이름`, 80); if (l.url !== undefined && !/^https:\/\/\S+$/.test(l.url)) fail(where, 'https 주소만 쓸 수 있습니다.'); });
  }

  function validate(c) {
    if (!c || c.version !== 2) fail('content.json', 'version 2 형식이 필요합니다.');
    str(c.title, '게임 제목', 30);
    if (!Array.isArray(c.dimensions) || c.dimensions.length !== 4) fail('dimensions', '게이지는 정확히 4개여야 합니다.');
    const keys = c.dimensions.map(d => d.key);
    c.dimensions.forEach((d, i) => { str(d.key, `게이지 ${i + 1} key`, 20); str(d.label, `게이지 ${i + 1} 이름`, 8); });
    if (!Number.isInteger(c.startAge) || !Number.isInteger(c.endingAge)) fail('나이', 'startAge, endingAge는 정수여야 합니다.');
    for (const card of c.starts?.cards || []) { str(card.title, `출발 카드 ${card.id}`, 30); str(card.text, `출발 카드 ${card.id} 설명`, 160); effects(card.effects, keys, `출발 카드 ${card.id}`); }
    const stageIds = new Set(c.stages.map(s => s.id));
    for (const ev of c.events?.cards || []) {
      str(ev.title, `운명 카드 ${ev.id}`, 30); str(ev.text, `운명 카드 ${ev.id} 설명`, 160); effects(ev.effects, keys, `운명 카드 ${ev.id}`);
      if (!(ev.minAge <= ev.maxAge)) fail(`운명 카드 ${ev.id}`, 'minAge ≤ maxAge 여야 합니다.');
      for (const t of ev.targets || []) if (!stageIds.has(t)) fail(`운명 카드 ${ev.id}`, `targets의 '${t}'는 없는 시기입니다.`);
    }
    if (!Array.isArray(c.stages) || !c.stages.length) fail('stages', '시기가 하나 이상 필요합니다.');
    const seen = new Set(); let prev = c.startAge;
    for (const s of c.stages) {
      const w = `${s.age}세 시기(${s.id})`;
      if (seen.has(s.id)) fail(w, '시기 id가 중복됩니다.'); seen.add(s.id);
      if (!Number.isInteger(s.age) || s.age <= prev) fail(w, `나이는 앞 시기(${prev}세)보다 커야 합니다.`); prev = s.age;
      str(s.era, `${w} 시기 이름`, 12);
      if (!SCENES.includes(s.scene)) fail(w, `scene은 ${SCENES.join(', ')} 중 하나여야 합니다.`);
      if (!Array.isArray(s.questions) || !s.questions.length) fail(w, '질문이 하나 이상 필요합니다.');
      const qids = new Set();
      for (const q of s.questions) {
        const wq = `${w} 질문 '${q.id}'`;
        if (qids.has(q.id)) fail(wq, '질문 id가 중복됩니다.'); qids.add(q.id);
        str(q.title, `${wq} 제목`, 44); str(q.context, `${wq} 상황`, 130); str(q.reflection, `${wq} 생각해 볼 질문`, 70);
        flagList(q.when, wq);
        (q.contextIf || []).forEach(ci => { flagList(ci.when, wq); str(ci.text, `${wq} contextIf`, 130); });
        (q.lock || []).forEach(l => { flagList(l.when, `${wq} lock`); if (l.option !== 0 && l.option !== 1) fail(`${wq} lock`, 'option은 0(위) 또는 1(아래)이어야 합니다.'); str(l.reason, `${wq} lock 이유`, 40); });
        if (q.concept) { str(q.concept.label, `${wq} 개념 이름`, 40); str(q.concept.text, `${wq} 개념 설명`, 300); }
        links(q.sources, wq);
        if (!Array.isArray(q.options) || q.options.length !== 2) fail(wq, '선택지는 정확히 2개여야 합니다.');
        q.options.forEach((o, i) => {
          const wo = `${wq} 선택 ${i ? 'B' : 'A'}`;
          for (const [k, max] of Object.entries(OPTION_TEXT)) str(o[k], `${wo} ${k}`, max);
          effects(o.effects, keys, wo); flagList(o.set, wo);
          if (o.show !== undefined && (typeof o.show !== 'object' || Array.isArray(o.show))) fail(wo, 'show는 객체여야 합니다.');
          (o.ifFlag || []).forEach((f, j) => {
            flagList(f.when, `${wo} ifFlag ${j + 1}`);
            for (const [k, max] of Object.entries(OPTION_TEXT)) if (f[k] !== undefined) str(f[k], `${wo} ifFlag ${j + 1} ${k}`, max);
            if (f.effects) effects(f.effects, keys, `${wo} ifFlag ${j + 1}`);
          });
        });
      }
    }
    if (c.endingAge <= prev) fail('endingAge', `엔딩 나이는 마지막 시기(${prev}세)보다 커야 합니다.`);
    for (const k of [...keys, 'balance']) { const p = c.ending?.profiles?.[k]; if (!p) fail('ending.profiles', `'${k}' 엔딩이 없습니다.`); str(p.title, `엔딩 ${k} 제목`, 24); str(p.body, `엔딩 ${k} 본문`, 200); }
    return c;
  }

  // ---------- 난수 (같은 seed면 같은 결과: 되돌리기·재시연·하나 바꾸기용) ----------
  function rng(seed) {
    let a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
  const shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- 설정 ----------
  function defaultSettings(c) {
    return {
      stages: Object.fromEntries(c.stages.map(s => [s.id, s.enabled !== false])),
      startCards: true, events: true, gauges: true, votes: true, sound: true, fast: false,
    };
  }
  function activeStages(c, settings) { return c.stages.filter(s => settings.stages?.[s.id] ?? s.enabled !== false); }

  // ---------- 진행 ----------
  const keysOf = c => c.dimensions.map(d => d.key);
  const matches = (when, flags) => (when || []).every(f => f[0] === '!' ? !flags.includes(f.slice(1)) : flags.includes(f));
  const evFlags = flags => flags.filter(f => f.startsWith('ev-'));

  // 운명 카드는 바로 다음 시기에 영향을 주는 자리(targets)에 먼저 놓는다. 그런 자리가 모자라면 아무 데나.
  function planRun(c, settings, seed) {
    const r = rng(seed);
    const stages = activeStages(c, settings);
    const run = { stageIds: stages.map(s => s.id), startId: null, events: {} };
    if (settings.startCards && c.starts?.cards?.length) run.startId = pick(c.starts.cards, r).id;
    if (settings.events && c.events?.cards?.length) {
      // gap g는 g번째 시기 직전(1..n-1) 또는 엔딩 직전(n). 첫 시기 전에는 넣지 않는다.
      const n = stages.length, ages = [...stages.map(s => s.age), c.endingAge];
      const want = Math.min(c.maxEvents ?? 3, Math.max(1, Math.round(n * (c.eventRate ?? 0.3))));
      const used = new Set();
      const pool = (g, targeted) => {
        const mid = Math.round((ages[g - 1] + ages[g]) / 2);
        return c.events.cards.filter(e => e.minAge <= mid && mid <= e.maxAge && !used.has(e.id) && (!targeted || (g < n && (e.targets || []).includes(stages[g].id))));
      };
      const gaps = Array.from({ length: n }, (_, i) => i + 1);
      for (const targeted of [true, false]) {
        for (const g of shuffle(gaps, r)) {
          if (Object.keys(run.events).length >= want) break;
          if (run.events[g] || run.events[g - 1] || run.events[g + 1]) continue; // 연달아 나오지 않게
          const p = pool(g, targeted);
          if (!p.length) continue;
          const ev = pick(p, r); used.add(ev.id); run.events[g] = ev.id;
        }
      }
    }
    return run;
  }

  function fromRun(c, run, seed, cfg) {
    if (!run.stageIds.length) throw new Error('켜진 시기가 없습니다. 설정에서 하나 이상 켜 주세요.');
    const gauges = Object.fromEntries(keysOf(c).map(k => [k, c.baseline ?? 0]));
    const state = { v: 3, seed, cfg: { ...cfg }, run, phase: 'start', i: 0, page: 0, gauges, flags: [], picks: [], skipped: [], votes: {}, qids: {}, last: null };
    if (!run.startId) return enterStage(c, state, 0);
    return state;
  }
  function newGame(c, settings, seed = Date.now() % 2147483647) {
    // 시기마다 질문이 여럿이면 seed로 고른다. 지금은 시기마다 하나뿐이라 모두가 같은 질문을 만난다.
    return fromRun(c, planRun(c, settings, seed), seed, { randomQuestions: settings.randomQuestions !== false });
  }

  const stageAt = (c, state, i) => c.stages.find(s => s.id === state.run.stageIds[i]);
  function resolveQuestion(c, state, i) {
    const s = stageAt(c, state, i);
    const eligible = s.questions.filter(q => matches(q.when, state.flags));
    if (!eligible.length) return null;
    // 방금 운명 카드가 나왔다면 그 카드가 바꾸는 질문 중에서 고른다 (질문 자체·닫힌 문·바뀐 선택지·바뀐 상황).
    const ev = state.flags.filter(f => f.startsWith('ev-'));
    const touched = ev.length ? eligible.filter(q => ev.some(f => usesFlag(q, f))) : [];
    const pool = touched.length ? touched : eligible;
    if (!state.cfg.randomQuestions) return pool[0];
    return pick(pool, rng(state.seed + 7919 * (i + 1)));
  }
  function question(c, state) { const s = stageAt(c, state, state.i); return s && s.questions.find(q => q.id === state.qids[s.id]); }
  function contextOf(q, flags) { const v = (q.contextIf || []).find(ci => matches(ci.when, flags)); return v ? v.text : q.context; }
  function lockOf(q, k, flags) { const l = (q.lock || []).find(x => x.option === k && matches(x.when, flags)); return l ? l.reason : null; }
  // 운명 카드 등 조건이 반영된 선택지. changed: 바뀐 내용이 있음, locked: 닫힌 이유.
  function optionView(q, k, flags) {
    const base = q.options[k];
    let o = { ...base }, changed = false;
    for (const f of base.ifFlag || []) if (matches(f.when, flags)) { const { when, ...rest } = f; o = { ...o, ...rest }; changed = true; }
    delete o.ifFlag;
    return { ...o, changed, locked: lockOf(q, k, flags) };
  }
  const isEventQuestion = q => (q.when || []).some(f => f.startsWith('ev-'));

  function addEffects(gauges, eff, mult = 1) {
    const out = { ...gauges };
    for (const [k, v] of Object.entries(eff || {})) out[k] = Math.max(0, (out[k] ?? 0) + v * mult);
    return out;
  }

  // 시기 i로 들어간다 (그 앞에 운명 카드가 있으면 카드부터).
  function enterStage(c, state, i) {
    const n = state.run.stageIds.length;
    let s = { ...state, i };
    const ev = s.run.events[i];
    if (ev && !s.seen?.includes(`ev${i}`)) return { ...s, phase: 'event', eventId: ev };
    if (i >= n) return { ...s, phase: 'ending', page: 0, flags: s.flags.filter(f => !f.startsWith('ev-')) };
    const q = resolveQuestion(c, s, i);
    if (!q) return enterStage(c, s, i + 1); // 조건에 맞는 질문이 없으면 건너뜀
    return { ...s, phase: 'fork', qids: { ...s.qids, [stageAt(c, s, i).id]: q.id } };
  }

  function next(c, state) {
    switch (state.phase) {
      case 'start': {
        const card = c.starts.cards.find(x => x.id === state.run.startId);
        return enterStage(c, { ...state, gauges: addEffects(state.gauges, card.effects), last: { effects: card.effects } }, 0);
      }
      case 'event': {
        const card = c.events.cards.find(x => x.id === state.eventId);
        const s = { ...state, seen: [...(state.seen || []), `ev${state.i}`], flags: [...new Set([...state.flags, `ev-${card.id}`])], gauges: addEffects(state.gauges, card.effects), last: { effects: card.effects } };
        delete s.eventId;
        return enterStage(c, s, state.i);
      }
      case 'result': return enterStage(c, { ...state, last: null }, state.i + 1);
      case 'ending': return { ...state, page: state.page + 1 };
      default: return state;
    }
  }

  function choose(c, state, optIdx) {
    if (state.phase !== 'fork') return state;
    const s = stageAt(c, state, state.i), q = question(c, state);
    if (!q.options[optIdx]) throw new Error('없는 선택지입니다.');
    const o = optionView(q, optIdx, state.flags);
    if (o.locked) throw new Error(`닫힌 길입니다: ${o.locked}`);
    const ev = evFlags(state.flags), forced = !!lockOf(q, 1 - optIdx, state.flags);
    // 운명 카드의 영향은 바로 다음 갈림길까지만.
    const flags = [...new Set([...state.flags.filter(f => !f.startsWith('ev-')), ...(o.set || [])])];
    return { ...state, phase: 'result', flags, gauges: addEffects(state.gauges, o.effects), picks: [...state.picks, { stageId: s.id, qid: q.id, opt: optIdx, ev, forced, changed: o.changed }], last: { effects: o.effects } };
  }

  function skip(c, state) {
    if (state.phase !== 'fork') return state;
    const id = stageAt(c, state, state.i).id;
    return enterStage(c, { ...state, last: null, flags: state.flags.filter(f => !f.startsWith('ev-')), skipped: [...(state.skipped || []), id] }, state.i + 1);
  }
  function setVotes(state, stageId, a, b) { return { ...state, votes: { ...state.votes, [stageId]: [a, b] } }; }
  // 이 질문이 운명 카드(flag)의 영향을 받는가: 질문 자체·닫힌 문·바뀐 선택지·바뀐 상황
  function usesFlag(q, flag) {
    const has = w => (w || []).includes(flag);
    return has(q.when) || (q.lock || []).some(l => has(l.when)) || (q.contextIf || []).some(ci => has(ci.when)) || q.options.some(o => (o.ifFlag || []).some(f => has(f.when)));
  }
  // 이 운명 카드가 바로 다음 갈림길을 실제로 바꾸는가 (카드에 '다음 갈림길이 달라져요'를 띄울지)
  function eventAffectsNext(c, state) {
    if (state.phase !== 'event' || state.i >= state.run.stageIds.length) return false;
    const flag = `ev-${state.eventId}`, q = resolveQuestion(c, { ...state, flags: [...state.flags, flag] }, state.i);
    return !!(q && usesFlag(q, flag));
  }

  // 현재 나이: 화면 표시와 배경(하루의 시간)에 쓴다.
  function ageOf(c, state) {
    const stages = state.run.stageIds.map(id => c.stages.find(s => s.id === id));
    if (state.phase === 'title' || state.phase === 'start') return c.startAge;
    if (state.phase === 'ending') return c.endingAge;
    if (state.phase === 'event') { const a = state.i === 0 ? c.startAge : stages[state.i - 1].age, b = state.i < stages.length ? stages[state.i].age : c.endingAge; return Math.round((a + b) / 2); }
    return stages[state.i].age;
  }

  function gaugeScale(c, state) { return (c.baseline ?? 0) + 2 + Math.ceil(state.run.stageIds.length * 1.6); }

  function typeOf(c, gauges) {
    const sorted = [...keysOf(c)].sort((a, b) => gauges[b] - gauges[a]);
    return gauges[sorted[0]] === gauges[sorted[1]] ? 'balance' : sorted[0];
  }
  function summary(c, state) {
    const keys = keysOf(c);
    const sorted = [...keys].sort((a, b) => state.gauges[b] - state.gauges[a]);
    const type = typeOf(c, state.gauges);
    const dim = k => c.dimensions.find(d => d.key === k);
    const path = state.picks.map(p => {
      const stage = c.stages.find(s => s.id === p.stageId), q = stage.questions.find(x => x.id === p.qid);
      return { stage, question: q, chosen: optionView(q, p.opt, p.ev || []), other: optionView(q, 1 - p.opt, p.ev || []), opt: p.opt, forced: !!p.forced, changed: !!p.changed, votes: state.votes[p.stageId] || null };
    });
    const voted = path.filter(p => p.votes && p.votes[0] + p.votes[1] > 0);
    const split = voted.length ? voted.reduce((best, p) => { const d = Math.abs(p.votes[0] - p.votes[1]) / (p.votes[0] + p.votes[1]); return d < best.d ? { d, p } : best; }, { d: 2, p: null }).p : null;
    const tops = sorted.filter(k => state.gauges[k] === state.gauges[sorted[0]]).map(dim);
    return { type, profile: c.ending.profiles[type], top: dim(sorted[0]), tops, low: dim(sorted[sorted.length - 1]), gauges: { ...state.gauges }, path, voted, split: voted.length > 1 ? split : null };
  }

  // 같은 출발·같은 운명 카드로, 한 갈림길만 반대로 골랐다면. 조건 때문에 뒤의 질문이 바뀌면 같은 쪽(위/아래)을 골랐다고 본다.
  function rerun(c, state, flipStageId) {
    const choice = Object.fromEntries(state.picks.map(p => [p.stageId, p.opt]));
    const skipped = new Set(state.skipped || []);
    let r = fromRun(c, state.run, state.seed, state.cfg), guard = 0;
    while (r.phase !== 'ending' && guard++ < 500) {
      if (r.phase !== 'fork') { r = next(c, r); continue; }
      const id = stageAt(c, r, r.i).id;
      if (skipped.has(id)) { r = skip(c, r); continue; }
      let k = choice[id] ?? 0;
      if (id === flipStageId) k = 1 - k;
      if (lockOf(question(c, r), k, r.flags)) k = 1 - k;
      r = choose(c, r, k);
    }
    return { ...r, votes: state.votes };
  }
  // 이번 판(같은 출발·운명 카드)에서 나올 수 있는 모든 결말
  function enumerate(c, state) {
    const skipped = new Set(state.skipped || []), out = [];
    const walk = r => {
      while (r.phase !== 'ending' && r.phase !== 'fork') r = next(c, r);
      if (r.phase === 'ending') { out.push(r); return; }
      if (skipped.has(stageAt(c, r, r.i).id)) return walk(skip(c, r));
      const q = question(c, r);
      for (const k of [0, 1]) if (!lockOf(q, k, r.flags)) walk(choose(c, r, k));
    };
    walk(fromRun(c, state.run, state.seed, state.cfg));
    return out;
  }
  // 두 게이지 묶음을 도넛으로 그렸을 때 겹치는 비율 (0~1)
  function overlap(a, b) {
    const ta = Object.values(a).reduce((x, y) => x + y, 0) || 1, tb = Object.values(b).reduce((x, y) => x + y, 0) || 1;
    return Object.keys(a).reduce((s, k) => s + Math.min(a[k] / ta, (b[k] ?? 0) / tb), 0);
  }

  return { SCENES, usesFlag, validate, defaultSettings, activeStages, planRun, newGame, fromRun, next, choose, skip, setVotes, question, contextOf, optionView, lockOf, isEventQuestion, eventAffectsNext, stageAt, ageOf, gaugeScale, typeOf, summary, rerun, enumerate, overlap, matches };
});
