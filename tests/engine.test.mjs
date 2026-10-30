import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../src/engine.js');
const content = () => JSON.parse(readFileSync(new URL('../content.json', import.meta.url), 'utf8'));
const presentation = c => ({ ...E.defaultSettings(c), stages: Object.fromEntries(c.stages.map(s => [s.id, !!s.presentation])) });

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
function endingShare(c, settings) {
  const t = {}, ends = E.enumerate(c, E.newGame(c, settings, 1));
  for (const s of ends) { const k = E.typeOf(c, s.gauges); t[k] = (t[k] || 0) + 1; }
  return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / ends.length]));
}

test('content.json이 검증을 통과한다', () => { assert.doesNotThrow(() => E.validate(content())); });

test('시기마다 질문은 하나, 전체 10문항이고 나이대는 10대부터 70대까지', () => {
  const c = content();
  assert.equal(c.stages.length, 10);
  for (const s of c.stages) assert.equal(s.questions.length, 1, `${s.id} 질문 수`);
  const decades = c.stages.map(s => Math.floor(s.age / 10) * 10);
  assert.deepEqual(decades, [10, 20, 20, 30, 30, 40, 40, 50, 60, 70]);
});

test('무작위가 없다: seed가 달라도 같은 질문, 같은 카드, 같은 결과', () => {
  const c = content(), settings = E.defaultSettings(c);
  const run = seed => { const s = play(c, settings, seed, id => id.length % 2); return JSON.stringify([s.run, s.picks, s.gauges]); };
  for (const seed of [2, 77, 12345, -9]) assert.equal(run(seed), run(1));
});

test('출발 카드와 운명 카드는 하나씩이고, 운명 카드는 부모님 돌봄 질문 바로 앞에 나온다', () => {
  const c = content();
  assert.equal(c.starts.cards.length, 1);
  assert.equal(c.events.cards.length, 1);
  for (const settings of [E.defaultSettings(c), presentation(c)]) {
    const run = E.planRun(c, settings, 1), gaps = Object.keys(run.events).map(Number);
    assert.equal(run.startId, c.starts.cards[0].id);
    assert.equal(gaps.length, 1);
    assert.equal(run.stageIds[gaps[0]], 'midlife');
    assert.equal(run.events[gaps[0]], c.events.cards[0].id);
  }
});

test('운명 카드를 지나면 돌봄 질문이 나오고, 카드의 효과가 게이지에 반영된다', () => {
  const c = content(), card = c.events.cards[0];
  let s = E.newGame(c, E.defaultSettings(c), 1);
  while (s.phase !== 'event') s = s.phase === 'fork' ? E.choose(c, s, 0) : E.next(c, s);
  assert.equal(s.eventId, card.id);
  assert.ok(E.eventAffectsNext(c, s));
  const after = E.next(c, s);
  assert.equal(E.question(c, after).id, 'care-or-work');
  for (const [k, v] of Object.entries(card.effects)) assert.equal(after.gauges[k], Math.max(0, s.gauges[k] + v));
});

test('10문항: 모든 결말이 엔딩에 도착하고 다섯 엔딩이 고르게 나온다', () => {
  const c = content(), settings = E.defaultSettings(c);
  const ends = E.enumerate(c, E.newGame(c, settings, 1));
  assert.equal(ends.length, 2 ** 10);
  for (const s of ends) { assert.equal(s.picks.length, 10); assert.ok(E.summary(c, s).profile.title); }
  const share = endingShare(c, settings);
  console.log('  10문항 엔딩 분포:', Object.fromEntries(Object.entries(share).map(([k, v]) => [k, `${Math.round(v * 100)}%`])));
  for (const k of ['growth', 'passion', 'ease', 'connection', 'balance']) assert.ok(share[k] >= 0.12, `${k} 엔딩이 12% 미만`);
  assert.ok(Math.max(...Object.values(share)) <= 0.32, '한 엔딩이 32%를 넘음');
});

test('발표 화면은 표시된 5문항만, 나이 순서대로 나오고 끝까지 간다', () => {
  const c = content(), settings = presentation(c);
  const stages = E.activeStages(c, settings);
  assert.deepEqual(stages.map(s => s.id), ['university', 'twenties', 'career-mid', 'vacation', 'midlife']);
  const ends = E.enumerate(c, E.newGame(c, settings, 1));
  assert.equal(ends.length, 2 ** 5);
  for (const s of ends) assert.equal(s.phase, 'ending');
});

test('양쪽 선택지에 같은 게이지가 붙어 쏠리는 질문이 없다', () => {
  const c = content();
  for (const s of c.stages) for (const q of s.questions) {
    const [a, b] = q.options.map(o => Object.entries(o.effects).filter(([, v]) => v > 0).map(([k]) => k));
    const both = a.filter(k => b.includes(k));
    assert.ok(both.length <= (q.id === 'pay-or-balance' ? 1 : 0), `${q.id}: 양쪽 모두 ${both}`);
  }
});

test('한 갈림길만 바꿔도 다시 계산되고, 원의 대부분은 그대로', () => {
  const c = content(), s = play(c, E.defaultSettings(c), 1, id => id.length % 2);
  let minOv = 1;
  for (const p of s.picks) {
    const r = E.rerun(c, s, p.stageId);
    assert.equal(r.phase, 'ending');
    assert.equal(r.picks.find(x => x.stageId === p.stageId).opt, 1 - p.opt);
    minOv = Math.min(minOv, E.overlap(s.gauges, r.gauges));
  }
  assert.ok(minOv > 0.7, `겹침 최솟값 ${minOv}`);
});

test('건너뛰기와 손들기 투표 기록', () => {
  const c = content();
  let s = E.newGame(c, { ...E.defaultSettings(c), startCards: false }, 5);
  assert.equal(E.stageAt(c, s, s.i).id, 'middle-school');
  s = E.setVotes(s, 'middle-school', 12, 9);
  s = E.next(c, E.choose(c, s, 0));
  s = E.skip(c, s);
  assert.deepEqual(s.skipped, ['university']);
  assert.equal(E.stageAt(c, s, s.i).id, 'twenties');
  assert.equal(E.summary(c, s).split, null, '투표가 하나뿐이면 "가장 팽팽한 질문"을 고르지 않는다');
  s = E.setVotes(s, 'twenties', 10, 10);
  while (s.phase !== 'ending') s = s.phase === 'fork' ? E.choose(c, s, 1) : E.next(c, s);
  const sum = E.summary(c, s);
  assert.equal(sum.voted.length, 2);
  assert.equal(sum.split.stage.id, 'twenties');
});

test('잘못된 콘텐츠는 어디가 틀렸는지 알려 준다', () => {
  const c = content(); c.stages[0].questions[0].options[0].effects = { happy: 3 };
  assert.throws(() => E.validate(c), /없는 게이지/);
  const d = content(); d.stages[2].age = 5;
  assert.throws(() => E.validate(d), /앞 시기/);
  const e = content(); e.events.cards[0].targets = ['nowhere'];
  assert.throws(() => E.validate(e), /없는 시기/);
});
