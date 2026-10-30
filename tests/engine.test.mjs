import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../src/engine.js');
const content = () => JSON.parse(readFileSync(new URL('../content.json', import.meta.url), 'utf8'));
const noCards = c => ({ ...E.defaultSettings(c), startCards: false, events: false });

// 주어진 선택(시기 id → 0/1, 없으면 0)으로 끝까지 진행한다.
function play(c, settings, seed, pickFn = () => 0) {
  let s = E.newGame(c, settings, seed), guard = 0;
  while (s.phase !== 'ending' && guard++ < 500) {
    if (s.phase !== 'fork') { s = E.next(c, s); continue; }
    const q = E.question(c, s); let k = pickFn(E.stageAt(c, s, s.i).id, s);
    if (E.lockOf(q, k, s.flags)) k = 1 - k;
    s = E.choose(c, s, k);
  }
  return s;
}
// stageId 갈림길까지 간 뒤, 그 자리의 질문을 qid로 정하고 flags를 더한다.
function forkAt(c, settings, seed, stageId, flags = [], qid = null) {
  let s = E.newGame(c, settings, seed);
  while (!(s.phase === 'fork' && E.stageAt(c, s, s.i).id === stageId)) s = s.phase === 'fork' ? E.choose(c, s, 0) : E.next(c, s);
  return { ...s, flags: [...s.flags, ...flags], qids: qid ? { ...s.qids, [stageId]: qid } : s.qids };
}
// 여러 판(질문 세트가 다름)의 모든 결말을 모아 엔딩 비율을 낸다.
function endingShare(c, settings, seeds) {
  const t = {}; let n = 0;
  for (const seed of seeds) for (const s of E.enumerate(c, E.newGame(c, settings, seed))) { const k = E.typeOf(c, s.gauges); t[k] = (t[k] || 0) + 1; n++; }
  return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / n]));
}

test('content.json이 검증을 통과한다', () => { assert.doesNotThrow(() => E.validate(content())); });

test('기본 코스: 모든 결말이 엔딩에 도착하고, 여러 판을 합치면 다섯 엔딩이 고르게 나온다', () => {
  const c = content(), settings = noCards(c);
  const n = E.activeStages(c, settings).length;
  const ends = E.enumerate(c, E.newGame(c, settings, 1));
  assert.equal(ends.length, 2 ** n);
  for (const s of ends) { assert.equal(s.picks.length, n); assert.ok(E.summary(c, s).profile.title); }
  const share = endingShare(c, settings, Array.from({ length: 30 }, (_, i) => i + 1));
  console.log(`  기본 ${n}문항 · 30판 × ${ends.length}경로 엔딩 분포:`, Object.fromEntries(Object.entries(share).map(([k, v]) => [k, `${Math.round(v * 100)}%`])));
  for (const k of ['growth', 'passion', 'ease', 'connection', 'balance']) assert.ok(share[k] >= 0.08, `${k} 엔딩이 8% 미만`);
  assert.ok(Math.max(...Object.values(share)) <= 0.32, '한 엔딩이 32%를 넘음');
});

test('출발 카드마다 엔딩이 한쪽으로 쏠리지 않는다', () => {
  const c = content(), settings = { ...E.defaultSettings(c), events: false };
  for (const card of c.starts.cards) {
    const seeds = []; for (let seed = 1; seeds.length < 12; seed++) if (E.planRun(c, settings, seed).startId === card.id) seeds.push(seed);
    const share = endingShare(c, settings, seeds);
    assert.ok(Math.max(...Object.values(share)) < 0.5, `${card.id} 출발 시 한 엔딩이 절반 이상`);
  }
});

test('나이대마다 질문 2~3개 중 하나가 무작위로 나오고, 34세 아이 여부에 따라 45·52세 후보가 달라진다', () => {
  const c = content(), settings = noCards(c);
  for (const s of c.stages.filter(s => s.enabled)) assert.ok(s.questions.length >= 2, `${s.age}세 질문이 ${s.questions.length}개`);
  const seen = { parent: { midlife: new Set(), fifties: new Set() }, none: { midlife: new Set(), fifties: new Set() } }, perStage = {};
  for (let seed = 1; seed <= 300; seed++) {
    const s = play(c, settings, seed, id => (id.length + seed) % 2);
    for (const p of s.picks) (perStage[p.stageId] ||= new Set()).add(p.qid);
    const key = s.flags.includes('parent') ? 'parent' : 'none';
    for (const id of ['midlife', 'fifties']) seen[key][id].add(s.picks.find(p => p.stageId === id).qid);
  }
  for (const s of c.stages.filter(s => s.enabled)) {
    const plain = s.questions.filter(q => !E.isEventQuestion(q)).map(q => q.id);
    for (const id of plain) assert.ok(perStage[s.id].has(id), `${s.age}세 '${id}'가 300판 동안 한 번도 안 나옴`);
  }
  assert.deepEqual([...seen.parent.midlife].sort(), ['exercise-or-diet', 'school-district']);
  assert.deepEqual([...seen.none.midlife].sort(), ['exercise-or-diet', 'parents-together']);
  assert.deepEqual([...seen.parent.fifties].sort(), ['family-help', 'old-friend', 'retire-or-tuition']);
  assert.deepEqual([...seen.none.fifties].sort(), ['family-help', 'old-friend']);
});

test('운명 카드는 영향을 줄 수 있는 갈림길 바로 앞에 놓이고, 나이에 맞고, 연달아 나오지 않는다', () => {
  const c = content(), settings = E.defaultSettings(c);
  const stages = E.activeStages(c, settings), ages = [...stages.map(s => s.age), c.endingAge];
  let targeted = 0, total = 0;
  for (let seed = 1; seed < 300; seed++) {
    const run = E.planRun(c, settings, seed);
    assert.deepEqual(run, E.planRun(c, settings, seed));
    const gaps = Object.keys(run.events).map(Number).sort((a, b) => a - b);
    assert.ok(gaps.length >= 1 && gaps.length <= c.maxEvents);
    gaps.forEach((g, i) => { if (i) assert.ok(g - gaps[i - 1] > 1); });
    for (const g of gaps) {
      const ev = c.events.cards.find(e => e.id === run.events[g]), mid = Math.round((ages[g - 1] + ages[g]) / 2);
      assert.ok(ev.minAge <= mid && mid <= ev.maxAge, `${ev.id} @${mid}`);
      total++; if (g < stages.length && ev.targets.includes(stages[g].id)) targeted++;
    }
  }
  assert.ok(targeted / total > 0.95, `다음 갈림길에 영향을 주는 카드 비율 ${Math.round(targeted / total * 100)}%`);
});

test('운명 카드가 다음 갈림길 앞에 오면 그 질문은 실제로 달라진다 (모든 경로)', () => {
  const c = content(), settings = E.defaultSettings(c);
  let checked = 0;
  for (let seed = 1; seed < 60; seed++) {
    const walk = (s, depth) => {
      while (s.phase !== 'ending' && s.phase !== 'fork' && s.phase !== 'event') s = E.next(c, s);
      if (s.phase === 'ending' || depth > 3) return;
      if (s.phase === 'event') {
        const targeted = s.i < s.run.stageIds.length && (c.events.cards.find(e => e.id === s.eventId).targets || []).includes(E.stageAt(c, s, s.i).id);
        if (targeted) { checked++; assert.ok(E.eventAffectsNext(c, s), `seed ${seed}: ${s.eventId} → ${E.stageAt(c, s, s.i).id}에서 바뀌는 게 없음`); }
        return walk(E.next(c, s), depth);
      }
      const q = E.question(c, s);
      for (const k of [0, 1]) if (!E.lockOf(q, k, s.flags)) walk(E.choose(c, s, k), depth + (k ? 1 : 0));
    };
    walk(E.newGame(c, settings, seed), 0);
  }
  assert.ok(checked > 100);
});

test('운명 카드가 나오면 그 카드가 바꾸는 질문이 뽑힌다', () => {
  const c = content(), settings = noCards(c);
  for (let seed = 1; seed < 40; seed++) {
    const s = forkAt(c, settings, seed, 'first-job');
    const before = { ...s, phase: 'result', i: s.i - 1 };
    const withEv = E.next(c, { ...before, run: { ...before.run, events: { ...before.run.events, [s.i]: 'recession' } } });
    const fork = E.next(c, withEv);
    assert.equal(E.question(c, fork).id, 'love-or-skill');
  }
});

test('운명 카드: 문이 닫히면 그 길은 고를 수 없고, 영향은 다음 갈림길까지만', () => {
  const c = content(), settings = noCards(c);
  const s = forkAt(c, settings, 1, 'middle-school', ['ev-transfer'], 'old-or-new-friend'), q = E.question(c, s);
  assert.ok(E.optionView(q, 0, s.flags).locked);
  assert.throws(() => E.choose(c, s, 0), /닫힌 길/);
  const r = E.choose(c, s, 1);
  assert.equal(r.picks.at(-1).forced, true);
  assert.ok(!r.flags.some(f => f.startsWith('ev-')), '운명 카드 표시가 남아 있음');
});

test('운명 카드: 선택지 내용과 효과가 바뀐다', () => {
  const c = content(), settings = noCards(c);
  const s = forkAt(c, settings, 1, 'first-job', ['ev-chance'], 'love-or-skill'), q = E.question(c, s);
  const v = E.optionView(q, 1, s.flags);
  assert.equal(v.changed, true);
  assert.notEqual(v.gain, q.options[1].gain);
  const r = E.choose(c, s, 1);
  assert.equal(r.gauges.growth - s.gauges.growth, v.effects.growth);
  assert.equal(r.picks.at(-1).changed, true);
});

test('운명 카드: 부모님 병환이 나오면 45세 질문 자체가 바뀐다', () => {
  const c = content(), settings = noCards(c);
  let s = forkAt(c, settings, 1, 'family', [], 'child');
  s = E.next(c, E.choose(c, s, 0)); // 34세 아이 → 38세
  s = E.choose(c, s, 0);
  s = { ...s, run: { ...s.run, events: { ...s.run.events, [s.i + 1]: 'parents' } } };
  s = E.next(c, s); assert.equal(s.phase, 'event');
  s = E.next(c, s); assert.equal(E.question(c, s).id, 'care-or-work');
});

test('실제 운명 카드가 들어간 판도 모두 끝까지 간다', () => {
  const c = content(), settings = E.defaultSettings(c);
  for (let seed = 1; seed < 120; seed++) {
    const ends = E.enumerate(c, E.newGame(c, settings, seed));
    assert.ok(ends.length >= 2 ** 9, `seed ${seed}: 결말 ${ends.length}개`);
    for (const s of ends.slice(0, 50)) assert.ok(E.summary(c, s).profile.title);
  }
});

test('하나만 바꾸기: 그 갈림길만 바뀌고, 원의 대부분은 그대로', () => {
  const c = content(), settings = E.defaultSettings(c);
  const s = play(c, settings, 77, id => id.length % 2);
  let minOv = 1;
  for (const p of s.picks) {
    if (p.forced) continue;
    const r = E.rerun(c, s, p.stageId);
    assert.equal(r.phase, 'ending');
    assert.equal(r.picks.find(x => x.stageId === p.stageId).opt, 1 - p.opt);
    const same = s.picks.filter(x => x.stageId !== p.stageId && r.picks.find(y => y.stageId === x.stageId)?.opt === x.opt).length;
    assert.ok(same >= s.picks.length - 3);
    minOv = Math.min(minOv, E.overlap(s.gauges, r.gauges));
  }
  assert.ok(minOv > 0.7, `겹침 최솟값 ${minOv}`);
});

test('모든 시기를 켜도 진행되고, 결혼하면 partner 플래그가 생긴다', () => {
  const c = content(), settings = { ...noCards(c), stages: Object.fromEntries(c.stages.map(s => [s.id, true])) };
  for (let m = 0; m < 400; m++) { const s = play(c, settings, 3, id => (id.charCodeAt(0) + m) % 2); assert.ok(s.flags.includes('partner')); }
});

test('무작위 질문: 같은 seed면 같은 질문, seed가 바뀌면 다른 질문도 나온다', () => {
  const c = content(), settings = noCards(c);
  const qs = seed => play(c, settings, seed).picks.map(p => p.qid).join(',');
  assert.equal(qs(42), qs(42));
  assert.ok(new Set(Array.from({ length: 40 }, (_, i) => qs(i + 1))).size > 1);
});

test('건너뛰기와 투표 기록', () => {
  const c = content(), settings = noCards(c);
  let s = E.newGame(c, settings, 5);
  assert.equal(E.stageAt(c, s, s.i).id, 'childhood');
  s = E.setVotes(s, 'childhood', 12, 9);
  s = E.next(c, E.choose(c, s, 0));
  s = E.skip(c, s);
  assert.deepEqual(s.skipped, ['middle-school']);
  assert.equal(E.stageAt(c, s, s.i).id, 'college');
  assert.equal(E.summary(c, s).split, null, '투표가 하나뿐이면 "가장 팽팽한 질문"을 고르지 않는다');
  s = E.setVotes(s, 'college', 10, 10);
  while (s.phase !== 'ending') s = s.phase === 'fork' ? E.choose(c, s, 1) : E.next(c, s);
  const sum = E.summary(c, s);
  assert.equal(sum.voted.length, 2);
  assert.equal(sum.split.stage.id, 'college');
  assert.equal(E.rerun(c, s, 'college').skipped.length, 1, '하나 바꾸기도 건너뛴 시기는 건너뛴다');
});

test('잘못된 콘텐츠는 어디가 틀렸는지 알려 준다', () => {
  const c = content(); c.stages[0].questions[0].options[0].effects = { happy: 3 };
  assert.throws(() => E.validate(c), /없는 게이지/);
  const d = content(); d.stages[2].age = 5;
  assert.throws(() => E.validate(d), /앞 시기/);
  const e = content(); e.events.cards[0].targets = ['nowhere'];
  assert.throws(() => E.validate(e), /없는 시기/);
});
