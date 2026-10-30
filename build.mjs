// src/ + content.json + fonts/ → 더블클릭으로 열리는 HTML 한 파일.
// 사용: node build.mjs   (content.json을 고친 뒤 다시 실행)
//       node build.mjs --out dist/index.html   (웹 배포용)
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const outFlag = process.argv.indexOf('--out');
const OUT = outFlag > 0 ? resolve(process.argv[outFlag + 1]) : join(root, '..', '인생갈림길_행복의조건_4조.html');
const read = p => readFileSync(join(root, p), 'utf8');
const require = createRequire(import.meta.url);

// 1) 콘텐츠 검증: 틀린 곳이 있으면 여기서 멈춘다.
const rawContent = read('content.json');
let content;
try { content = require('./src/engine.js').validate(JSON.parse(rawContent)); }
catch (e) { console.error(`\n✗ content.json 오류: ${e.message}\n`); process.exit(1); }

// 2) 폰트: 새 글자가 생겼으면 다시 줄인다 (fonttools 필요). 실패하면 시스템 폰트로 대체.
const FONT_FILES = ['pretendard-500.woff', 'pretendard-700.woff', 'pretendard-800.woff', 'yache.woff'];
function fontsReady() {
  if (!FONT_FILES.every(f => existsSync(join(root, 'fonts', f))) || !existsSync(join(root, 'fonts', 'chars.txt'))) return false;
  const have = new Set(read('fonts/chars.txt'));
  const used = [rawContent, ...['template.html', 'app.js', 'art.js', 'engine.js'].map(f => read(`src/${f}`))].join('');
  return [...used].every(ch => have.has(ch) || ch.charCodeAt(0) < 0x20 || /\s/.test(ch));
}
let fonts = '';
if (!fontsReady()) {
  try { execFileSync('python3', [join(root, 'tools', 'subset_fonts.py')], { stdio: 'inherit' }); }
  catch { console.warn('! 폰트를 새로 만들지 못했습니다. 없는 글자는 시스템 폰트로 보입니다.'); }
}
const face = (family, file, weight) => existsSync(join(root, 'fonts', file))
  ? `@font-face{font-family:'${family}';src:url(data:font/woff;base64,${readFileSync(join(root, 'fonts', file)).toString('base64')}) format('woff');font-weight:${weight};font-display:block}`
  : '';
fonts = [face('PretendardLG', 'pretendard-500.woff', '100 599'), face('PretendardLG', 'pretendard-700.woff', '600 749'), face('PretendardLG', 'pretendard-800.woff', '750 900'), face('YacheLG', 'yache.woff', '100 900')].join('\n');

// 3) 팀이 녹음한 효과음: sounds/laugh.m4a 처럼 이름을 맞춰 넣으면 합성음 대신 그 파일을 쓴다.
const SOUND_TYPES = { mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg' };
const sounds = {};
if (existsSync(join(root, 'sounds'))) for (const f of readdirSync(join(root, 'sounds'))) {
  const m = f.normalize('NFC').match(/^([a-z]+)\.(mp3|m4a|wav|ogg)$/i);
  if (m) sounds[m[1].toLowerCase()] = `data:${SOUND_TYPES[m[2].toLowerCase()]};base64,${readFileSync(join(root, 'sounds', f)).toString('base64')}`;
}
if (Object.keys(sounds).length) console.log(`  효과음 파일: ${Object.keys(sounds).join(', ')}`);

// 4) 한 파일로 합치기
const scripts = ['engine.js', 'art.js', 'app.js'].map(f => read(`src/${f}`)).join('\n;\n');
const json = JSON.stringify(content, null, 1).replace(/</g, '\\u003c');
const html = read('src/template.html')
  .replace('/*__FONTS__*/', () => fonts)
  .replace('/*__STYLE__*/', () => read('src/style.css'))
  .replace('<!--__CONTENT__-->', () => `<script type="application/json" id="game-content">\n${json}\n</script>`)
  .replace('<!--__SOUNDS__-->', () => `<script type="application/json" id="game-sounds">${JSON.stringify(sounds)}</script>`)
  .replace('/*__SCRIPTS__*/', () => scripts.replace(/<\/script/gi, '<\\/script'));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(`✓ ${relative(process.cwd(), OUT)} (${(statSync(OUT).size / 1024).toFixed(0)} KB)`);
