const $ = (selector) => document.querySelector(selector);

const ui = {
  app: $('#app'),
  modePill: $('#mode-pill'),
  audioPill: $('#audio-pill'),
  sceneCounter: $('#scene-counter'),
  sceneTitle: $('#scene-title'),
  sceneProgress: $('#scene-progress'),
  timeLeft: $('#time-left'),
  speedLabel: $('#speed-label'),
  headerLeft: $('#header-left'),
  headerRight: $('#header-right'),
  footerLeft: $('#footer-left'),
  footerRight: $('#footer-right'),
  sceneLines: $('#scene-lines'),
  visualDisplay: $('#visual-display'),
  transition: $('#transition-overlay'),
  noiseCanvas: $('#noise-canvas'),
  startNormal: $('#start-normal'),
  startCtrlc: $('#start-ctrlc'),
  hotCtrlc: $('#hot-ctrlc'),
  toggleAudio: $('#toggle-audio'),
  playPause: $('#play-pause'),
  nextScene: $('#next-scene'),
  restartScene: $('#restart-scene'),
  toggleSpeed: $('#toggle-speed'),
  reducedFlash: $('#reduced-flash'),
  denseEffects: $('#dense-effects'),
};

const CORRUPT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/';
const HEAVY_GLITCH = '▓▒░█▄▀■□◘◙◚◛◜◝◞◟◠◡◢◣◤◥';
const NOISE_CHARS = '@#$%^&*!~`|/<>{}[]?;:+-=';

const EYE_FRAMES = [
  ['      /\\      ', '     /  \\     ', '    / ◉  \\    ', '   /______\\   ', '      ||      ', '   III III    '],
  ['     /\\       ', '    /  \\      ', '   / ◉  \\     ', '  /______\\    ', '     ||       ', '  III III     '],
  ['       /\\     ', '      /  \\    ', '     / ◉  \\   ', '    /______\\  ', '       ||     ', '    III III   '],
  ['        /\\    ', '       /  \\   ', '      / ◉  \\  ', '     /______\\ ', '        ||    ', '     III III  '],
  ['     /\\       ', '    /  \\      ', '   / ◎  \\     ', '  /________\\  ', '      ||      ', '   IIIIIII    '],
  ['      /\\      ', '     /--\\     ', '    / ◉  \\    ', '   /______\\   ', '      ||      ', '   III III    '],
  ['     **/\\**   ', '    */  \\*    ', '   */ ◉  \\*   ', '  */______\\*  ', '      ||      ', '   III III    '],
  ['      /\\      ', '     /==\\     ', '    /      \\  ', '   /________\\ ', '      ||      ', '   III III    '],
];

const BRAIN_FRAMES = [
  ['    _______    ', '   /       \\   ', '  | (o) (o) |  ', '  |   ~~~   |  ', '   \\_______/   ', '    |||||||||  ', '    |||||||||  '],
  ['    _______    ', '   / ~~~~~ \\   ', '  | (◉) (◉) |  ', '  |   ~~~   |  ', '   \\_______/   ', '    |||||||||  ', '    |||||||||  '],
  ['    _______    ', '   /       \\   ', '  | (@) (@) |  ', '  |   ---   |  ', '   \\_______/   ', '    ╔═══════╗  ', '    ╚═══════╝  '],
  ['   ________    ', '  /════════\\   ', ' | ●●●●●●●● |  ', ' |  UPLOAD  |  ', '  \\________/   ', '   ~~~~~~~~~~~  ', '   AKTARIM...  '],
];

const FAKE_LOG_POOL = [
  '[SYS  ] Çekirdek belleği başlatılıyor...          OK',
  '[NET  ] Ağ arayüzü eth0 bağlandı                  OK',
  '[SEC  ] Güvenlik duvarı kuralları yüklendi         OK',
  '[CPU  ] Frekans: 3.8GHz - Sıcaklık: 42°C          OK',
  '[MEM  ] RAM kullanımı: 2.1GB / 16GB               OK',
  '[PROC ] İşlem tablosu taranıyor...               WARN',
  '[SEC  ] Root yetkisi alındı                     CRIT',
  '[NET  ] Paket dinleme başlatıldı                CRIT',
  '[MEM  ] Heap corruption detected               CRIT',
  '[KERN ] Kernel panic yaklaşıyor                CRIT',
];

const FAKE_SCAN_POOL = [
  'Sistem taranıyor...',
  'Güvenlik açıkları analiz ediliyor...',
  'Bellek haritası çıkarılıyor...',
  'Ağ trafiği izleniyor...',
  'Süreçler listeleniyor...',
  'Dosya sistemi tarıyor...',
  'SSH anahtarları aranıyor...',
  'Kimlik analizi yapılıyor...',
];

const colors = {
  1: '#5cffb6',
  2: '#ff6670',
  3: '#7fe9ff',
  4: '#ffd66b',
  5: '#f4fff8',
  6: '#e986ff',
};

const state = {
  data: null,
  mode: 'normal',
  sceneIndex: 0,
  currentScene: null,
  sceneStart: 0,
  sceneDuration: 0,
  paused: true,
  hasStarted: false,
  fastMode: false,
  audioEnabled: true,
  reducedFlash: false,
  denseEffects: true,
  sceneRenderedAt: -1,
  visualFrame: -1,
  introLock: false,
  done: false,
  lastProgress: 0,
  sceneAdvancing: false,
};

const audioAssets = {
  normal: new Audio('./assets/Lonu.mp3'),
  ctrlc: new Audio('./assets/horror_bgm.mp3'),
  static: './assets/tv_static.wav',
  click: './assets/tv_click.wav',
  jumpscare: './assets/jumpscare.wav',
};

audioAssets.normal.loop = true;
audioAssets.ctrlc.loop = true;
audioAssets.normal.volume = 0.54;
audioAssets.ctrlc.volume = 0.7;

const noiseCtx = ui.noiseCanvas.getContext('2d', { alpha: true });

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function durationForMode(mode) {
  if (state.fastMode) {
    return mode === 'ctrlc' ? rand(3.2, 5.4) : rand(4.4, 6.4);
  }
  return mode === 'ctrlc' ? rand(8.8, 12.4) : rand(10.2, 14.8);
}

function currentList() {
  return state.data?.[state.mode] || [];
}

function totalScenes() {
  return currentList().length;
}

function syncResponsiveCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ui.noiseCanvas.width = Math.floor(window.innerWidth * dpr);
  ui.noiseCanvas.height = Math.floor(window.innerHeight * dpr);
  ui.noiseCanvas.style.width = `${window.innerWidth}px`;
  ui.noiseCanvas.style.height = `${window.innerHeight}px`;
  noiseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function setAudioPill() {
  ui.audioPill.textContent = state.audioEnabled ? 'Ses Açık' : 'Ses Kapalı';
  ui.audioPill.className = `pill ${state.audioEnabled ? 'active' : 'muted'}`;
}

function syncModeVisuals() {
  ui.app.classList.toggle('ctrlc', state.mode === 'ctrlc');
  const intensity = state.currentScene?.intensity || 0;
  ui.app.classList.toggle('glitch-strong', intensity >= 0.6 && state.denseEffects);
  ui.app.classList.toggle('glitch-max', intensity >= 0.88 && state.denseEffects);
  ui.modePill.textContent = state.mode === 'ctrlc' ? 'CTRL+C Modu' : 'Normal Mod';
  ui.modePill.className = `pill ${state.mode === 'ctrlc' ? 'ctrlc' : 'normal'}`;
  ui.speedLabel.textContent = state.fastMode ? 'Hızlı' : 'Standart';
}

function stopMusic() {
  for (const key of ['normal', 'ctrlc']) {
    audioAssets[key].pause();
    audioAssets[key].currentTime = 0;
  }
}

async function playMusicForMode() {
  stopMusic();
  if (!state.audioEnabled) return;
  const music = state.mode === 'ctrlc' ? audioAssets.ctrlc : audioAssets.normal;
  try {
    await music.play();
  } catch (_) {}
}

function playEffect(path, volume = 0.8) {
  if (!state.audioEnabled) return;
  const fx = new Audio(path);
  fx.volume = volume;
  fx.play().catch(() => {});
}

function maybeCorrupt(text, intensity) {
  if (intensity < 0.38 || !state.denseEffects) return text;
  const chance = clamp(intensity * 0.12, 0.04, 0.18);
  return [...text].map((char) => {
    if (char === ' ' || char === '\n' || Math.random() > chance) return char;
    const roll = Math.random();
    if (roll < intensity * 0.08) return randomChoice(HEAVY_GLITCH);
    if (roll < intensity * 0.24) return randomChoice(NOISE_CHARS);
    return randomChoice(CORRUPT_CHARS);
  }).join('');
}

function lineClass(line) {
  if (line.includes('[KRİTİK]') || line.includes('[CRIT]')) return 'crit';
  if (line.includes('[UYARI]') || line.includes('[WARN]')) return 'warn';
  if (line.includes('[TAMAM]') || line.includes('[OK]')) return 'ok';
  if (line.includes('[BİLGİ]') || line.includes('[INFO]')) return 'info';
  if (line.includes('╔') || line.includes('║') || line.includes('████')) return 'ascii';
  return 'plain';
}

function renderSceneLines(scene, progress) {
  const intensity = scene.intensity || 0;
  const html = [];
  const allLines = [...scene.lines, ...(scene.ascii_art || [])];
  allLines.forEach((rawLine) => {
    const computedLine = maybeCorrupt(rawLine, intensity * (progress > 0.55 ? 1.1 : 0.7));
    const klass = lineClass(rawLine);
    const tone = colors[scene.color] || colors[1];
    const extra = klass === 'crit'
      ? 'color:#ff7680;font-weight:700;'
      : klass === 'warn'
      ? 'color:#ffd66b;font-weight:700;'
      : klass === 'ok'
      ? 'color:#5cffb6;font-weight:700;'
      : klass === 'info'
      ? 'color:#7fe9ff;'
      : klass === 'ascii'
      ? `color:${tone};font-weight:700;`
      : `color:${tone};`;
    html.push(`<span class="line ${klass}" style="${extra}">${escapeHtml(computedLine)}</span>`);
  });
  ui.sceneLines.innerHTML = `<span class="glitch-text" data-text="${escapeHtml(scene.title)}">${escapeHtml(scene.title)}</span><br><br>${html.join('<br>')}`;
}

function renderEye(frame, intense) {
  const eye = EYE_FRAMES[Math.floor(frame / (intense ? 6 : 10)) % EYE_FRAMES.length].join('\n');
  return `
    <div class="visual-inner eye-wrap">
      <pre class="visual-ascii eye-core">${escapeHtml(eye)}</pre>
      <div class="visual-meta">Dönen üçgen göz · ${intense ? 'agresif' : 'sakin'} animasyon</div>
    </div>`;
}

function renderBrain(frame) {
  const brain = BRAIN_FRAMES[Math.floor(frame / 12) % BRAIN_FRAMES.length].join('\n');
  return `
    <div class="visual-inner brain-wrap">
      <pre class="visual-ascii">${escapeHtml(brain)}</pre>
      <div class="visual-meta">Beyin ASCII animasyonu · sahne yoğunluğu yükseliyor</div>
    </div>`;
}

function renderLogs(frame, intensity) {
  const lines = Array.from({ length: 6 }, (_, index) => {
    const ts = `${String((frame + index * 3) % 24).padStart(2, '0')}:${String((frame * 2 + index * 7) % 60).padStart(2, '0')}:${String((frame * 5 + index * 11) % 60).padStart(2, '0')}`;
    const msg = maybeCorrupt(randomChoice(FAKE_LOG_POOL), intensity * 0.6);
    return `<span>[${ts}] ${escapeHtml(msg)}</span>`;
  }).join('');
  return `<div class="visual-inner"><div class="log-stack">${lines}</div><div class="visual-meta">Fake system logs · buffer scroll</div></div>`;
}

function renderScan(progress, frame, color) {
  const message = FAKE_SCAN_POOL[Math.floor(frame / 18) % FAKE_SCAN_POOL.length];
  const pct = Math.round(progress * 100);
  return `
    <div class="visual-inner">
      <div style="width:100%;text-align:left;color:${color};font-size:0.86rem;">${escapeHtml(message)}</div>
      <div class="progress-track" style="height:14px;width:100%;"><div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg, ${color}, #ffffff);"></div></div>
      <pre class="visual-ascii">[${'█'.repeat(Math.floor(pct / 5)).padEnd(20, '░')}] ${String(pct).padStart(3, ' ')}%</pre>
      <div class="visual-meta">Tarama çubuğu · sahte operasyon ilerlemesi</div>
    </div>`;
}

function renderStream(progress, frame, color) {
  const width = 22;
  const pos = Math.floor((frame * 0.6) % width);
  const chars = Array.from({ length: width }, (_, i) => {
    if (i === pos) return '▶';
    if (Math.abs(i - pos) < 3) return '─';
    if (Math.abs(i - pos) < 6) return '·';
    return ' ';
  }).join('');
  return `
    <div class="visual-inner">
      <pre class="visual-ascii" style="color:${color};">${escapeHtml(chars)}\n${escapeHtml(chars.split('').reverse().join(''))}</pre>
      <div class="progress-track" style="height:12px;width:100%;"><div class="progress-fill" style="width:${Math.round(progress * 100)}%;background:linear-gradient(90deg, ${color}, rgba(255,255,255,0.85));"></div></div>
      <div class="visual-meta">Veri akışı · iki yönlü transfer simülasyonu</div>
    </div>`;
}

function renderHex(frame) {
  const base = 0x7ffe0000 + frame * 16;
  const rows = Array.from({ length: 8 }, (_, i) => {
    const addr = (base + i * 16).toString(16).toUpperCase().padStart(8, '0');
    const bytes = Array.from({ length: 8 }, () => Math.floor(rand(0, 255)).toString(16).toUpperCase().padStart(2, '0')).join(' ');
    const ascii = Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(rand(33, 90)))).join('');
    return `${addr}  ${bytes}  |${ascii}|`;
  }).join('<br>');
  return `<div class="visual-inner"><div class="hex-grid">${rows}</div><div class="visual-meta">Hex dump · kayan bellek görünümü</div></div>`;
}

function renderNumbers(frame, intensity) {
  const rows = Array.from({ length: 14 }, () => {
    return Array.from({ length: 18 }, (_, col) => {
      const pool = col % 3 === 0 ? '01アイウエオ' : '0123456789';
      return Math.random() < clamp(0.35 + intensity * 0.35, 0.35, 0.9) ? randomChoice(pool) : ' ';
    }).join(' ');
  }).join('\n');
  return `<div class="visual-inner"><pre class="visual-ascii" style="color:#5cffb6;">${escapeHtml(rows)}</pre><div class="visual-meta">Düşen sayılar · matrix benzeri akış</div></div>`;
}

function renderDotField(frame) {
  const dots = [];
  const radius = 34;
  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * 2 * i) / 16 + frame * 0.03;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius * 0.56;
    dots.push(`<span style="left:${x}%;top:${y}%;transform:translate(-50%,-50%) scale(${1 + 0.4 * Math.sin(frame * 0.05 + i)});"></span>`);
  }
  dots.push('<span class="center" style="left:50%;top:50%;transform:translate(-50%,-50%);"></span>');
  return `<div class="visual-inner"><div class="dot-field">${dots.join('')}</div><div class="visual-meta">İllüzyon merkez noktası · odak kırıcı titreşim</div></div>`;
}

function renderPulse(frame) {
  return `<div class="visual-inner"><div class="pulse-ring" style="animation-delay:-${(frame % 12) / 10}s"></div><pre class="visual-ascii">○ ◎ ● ◉ ○ ◎</pre><div class="visual-meta">Yayılan halka · alarm/ping etkisi</div></div>`;
}

function renderNeural(frame, color) {
  const active = (idx) => (Math.floor(frame / 12) + idx) % 3 === 0 ? 1 : 0.35;
  return `
    <div class="visual-inner neural-wrap">
      <svg viewBox="0 0 340 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g stroke="${color}" stroke-opacity="0.35">
          <path d="M60 40 L170 60 L280 40" />
          <path d="M60 40 L170 110 L280 40" />
          <path d="M60 40 L170 160 L280 40" />
          <path d="M60 110 L170 60 L280 110" />
          <path d="M60 110 L170 110 L280 110" />
          <path d="M60 110 L170 160 L280 110" />
          <path d="M60 180 L170 60 L280 180" />
          <path d="M60 180 L170 110 L280 180" />
          <path d="M60 180 L170 160 L280 180" />
        </g>
        <g fill="${color}">
          <circle cx="60" cy="40" r="10" fill-opacity="${active(1)}" />
          <circle cx="60" cy="110" r="10" fill-opacity="${active(2)}" />
          <circle cx="60" cy="180" r="10" fill-opacity="${active(3)}" />
          <circle cx="170" cy="60" r="10" fill-opacity="${active(4)}" />
          <circle cx="170" cy="110" r="10" fill-opacity="${active(5)}" />
          <circle cx="170" cy="160" r="10" fill-opacity="${active(6)}" />
          <circle cx="280" cy="40" r="10" fill-opacity="${active(7)}" />
          <circle cx="280" cy="110" r="10" fill-opacity="${active(8)}" />
          <circle cx="280" cy="180" r="10" fill-opacity="${active(9)}" />
        </g>
      </svg>
      <div class="visual-meta">Nöral ağ görselleştirmesi · bilinç aktarımı hissi</div>
    </div>`;
}

function renderNone(scene) {
  return `
    <div class="visual-inner">
      <pre class="visual-ascii" style="color:${state.mode === 'ctrlc' ? '#ffd8dc' : '#7fe9ff'};">${escapeHtml(scene.title)}</pre>
      <div class="visual-meta">Final açıklama · gerilim çözülmesi</div>
    </div>`;
}

function renderVisual(scene, progress, frame) {
  const color = colors[scene.color] || colors[1];
  switch (scene.visual_type) {
    case 'eye': return renderEye(frame, state.mode === 'ctrlc');
    case 'brain': return renderBrain(frame);
    case 'logs': return renderLogs(frame, scene.intensity || 0);
    case 'scan': return renderScan(progress, frame, color);
    case 'stream': return renderStream(progress, frame, color);
    case 'hex': return renderHex(frame);
    case 'numbers': return renderNumbers(frame, scene.intensity || 0);
    case 'dots': return renderDotField(frame);
    case 'pulse': return renderPulse(frame);
    case 'neural': return renderNeural(frame, color);
    default: return renderNone(scene);
  }
}

function updateSceneFrame(scene, progress, frame) {
  ui.sceneCounter.textContent = `${String(scene.scene_id + 1).padStart(2, '0')} / ${String(totalScenes()).padStart(2, '0')}`;
  ui.sceneTitle.textContent = scene.title;
  ui.headerLeft.textContent = `◀◀ ${scene.title} ▶▶`;
  ui.headerRight.textContent = `SAHNE: ${String(scene.scene_id + 1).padStart(2, '0')}/${String(totalScenes()).padStart(2, '0')}`;
  ui.footerLeft.textContent = `@LonySoraz | ${scene.footer_note || 'Web simülasyon portu'}`;
  ui.footerRight.textContent = state.done ? 'Deneyim tamamlandı' : `${Math.max(0, state.sceneDuration - (performance.now() - state.sceneStart) / 1000).toFixed(1)} sn kaldı`;
  ui.timeLeft.textContent = `${Math.max(0, state.sceneDuration - (performance.now() - state.sceneStart) / 1000).toFixed(1)} sn`;
  ui.sceneProgress.style.width = `${Math.round(progress * 100)}%`;

  state.lastProgress = progress;
  const redrawText = frame !== state.sceneRenderedAt;
  if (redrawText) {
    renderSceneLines(scene, progress);
    state.sceneRenderedAt = frame;
  }

  if (frame !== state.visualFrame) {
    ui.visualDisplay.innerHTML = renderVisual(scene, progress, frame);
    state.visualFrame = frame;
  }

  ui.sceneLines.style.color = colors[scene.color] || colors[1];
  ui.visualDisplay.style.color = colors[scene.color] || colors[1];
  syncModeVisuals();
}

async function runTransition(intense = false) {
  if (state.reducedFlash) return;
  ui.transition.classList.remove('hidden');
  ui.transition.classList.add('visible');
  ui.transition.classList.toggle('intense', intense);
  playEffect(audioAssets.static, intense ? 0.9 : 0.72);
  setTimeout(() => playEffect(audioAssets.click, intense ? 0.82 : 0.7), intense ? 420 : 280);
  await new Promise((resolve) => setTimeout(resolve, intense ? 920 : 720));
  ui.transition.classList.remove('visible', 'intense');
  ui.transition.classList.add('hidden');
}

function sceneAt(index) {
  return currentList()[index] || null;
}

function stopRun(resetDone = false) {
  state.paused = true;
  if (resetDone) state.done = false;
}

async function setScene(index, { transition = true } = {}) {
  const list = currentList();
  if (!list.length) return;
  state.done = false;
  state.sceneIndex = clamp(index, 0, list.length - 1);
  state.currentScene = list[state.sceneIndex];
  if (transition && state.hasStarted) {
    await runTransition(state.mode === 'ctrlc');
  }
  state.sceneDuration = durationForMode(state.mode);
  state.sceneStart = performance.now();
  state.sceneRenderedAt = -1;
  state.visualFrame = -1;
  syncModeVisuals();
}

async function finishSimulation() {
  state.done = true;
  state.paused = true;
  stopMusic();
  ui.footerRight.textContent = 'Simülasyon bitti';
  ui.timeLeft.textContent = '0.0 sn';
  ui.sceneProgress.style.width = '100%';
}

async function nextScene() {
  if (state.sceneAdvancing) return;
  state.sceneAdvancing = true;
  const list = currentList();
  if (state.sceneIndex >= list.length - 1) {
    await finishSimulation();
    state.sceneAdvancing = false;
    return;
  }
  const shouldJump = state.mode === 'ctrlc' && state.sceneIndex > 0 && state.sceneIndex % 8 === 0 && state.sceneIndex < list.length - 1;
  if (shouldJump) {
    playEffect(audioAssets.jumpscare, 0.9);
  }
  await setScene(state.sceneIndex + 1, { transition: true });
  state.sceneAdvancing = false;
}

async function restartScene() {
  if (!state.currentScene) return;
  state.sceneAdvancing = false;
  await setScene(state.sceneIndex, { transition: false });
}

async function startSimulation(mode = 'normal') {
  if (!state.data) return;
  state.mode = mode;
  state.hasStarted = true;
  state.paused = false;
  state.done = false;
  await playMusicForMode();
  if (mode === 'ctrlc') {
    await runTransition(true);
    playEffect(audioAssets.jumpscare, 0.95);
  }
  await setScene(0, { transition: false });
}

async function triggerCtrlCMode() {
  if (!state.data || state.mode === 'ctrlc' || state.introLock) return;
  state.introLock = true;
  state.mode = 'ctrlc';
  stopMusic();
  await runTransition(true);
  await playMusicForMode();
  playEffect(audioAssets.jumpscare, 0.95);
  state.paused = false;
  await setScene(0, { transition: false });
  state.introLock = false;
}

function togglePause() {
  if (!state.currentScene || state.done) return;
  state.paused = !state.paused;
  if (!state.paused) {
    state.sceneStart = performance.now() - state.lastProgress * state.sceneDuration * 1000;
  }
}

function updateButtons() {
  ui.playPause.textContent = state.paused ? 'Devam Et' : 'Duraklat';
  ui.toggleSpeed.textContent = state.fastMode ? 'Standart Hız' : 'Hızlı Mod';
}

function drawNoise(now) {
  const intensity = state.currentScene?.intensity || 0.04;
  const w = window.innerWidth;
  const h = window.innerHeight;
  noiseCtx.clearRect(0, 0, w, h);
  const particles = Math.floor((state.denseEffects ? 120 : 45) + intensity * 340);
  for (let i = 0; i < particles; i += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const alpha = Math.random() * (0.05 + intensity * 0.16);
    const size = Math.random() < 0.95 ? 1 : 2;
    let color = `rgba(255,255,255,${alpha})`;
    if (state.mode === 'ctrlc' && Math.random() < intensity * 0.22) {
      color = `rgba(255,100,110,${alpha})`;
    }
    noiseCtx.fillStyle = color;
    noiseCtx.fillRect(x, y, size, size);
  }
  const bandY = ((now / 18) % (h + 120)) - 60;
  const gradient = noiseCtx.createLinearGradient(0, bandY, 0, bandY + 80);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.5, `rgba(${state.mode === 'ctrlc' ? '255,77,90' : '127,233,255'},${0.05 + intensity * 0.08})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  noiseCtx.fillStyle = gradient;
  noiseCtx.fillRect(0, bandY, w, 80);
}

function frameLoop(now) {
  drawNoise(now);
  if (!state.paused && state.currentScene) {
    const elapsed = (now - state.sceneStart) / 1000;
    const progress = clamp(elapsed / state.sceneDuration, 0, 1);
    const frame = Math.floor(now / 130);
    updateSceneFrame(state.currentScene, progress, frame);
    if (progress >= 1 && !state.introLock) {
      nextScene();
    }
  } else if (state.currentScene) {
    const frame = Math.floor(now / 180);
    updateSceneFrame(state.currentScene, clamp(parseFloat(ui.sceneProgress.style.width || 0) / 100, 0, 1), frame);
  }
  updateButtons();
  requestAnimationFrame(frameLoop);
}

async function loadData() {
  const response = await fetch('./data/scenes.json');
  state.data = await response.json();
  ui.sceneCounter.textContent = `00 / ${String(state.data.normal_count).padStart(2, '0')}`;
  ui.sceneTitle.textContent = 'Başlatılmadı';
}

function bindEvents() {
  ui.startNormal.addEventListener('click', async () => {
    state.audioEnabled = true;
    setAudioPill();
    await startSimulation('normal');
  });

  ui.startCtrlc.addEventListener('click', async () => {
    state.audioEnabled = true;
    setAudioPill();
    await startSimulation('ctrlc');
  });

  ui.hotCtrlc.addEventListener('click', triggerCtrlCMode);
  ui.nextScene.addEventListener('click', nextScene);
  ui.restartScene.addEventListener('click', restartScene);

  ui.playPause.addEventListener('click', () => {
    if (!state.hasStarted) return;
    togglePause();
  });

  ui.toggleAudio.addEventListener('click', async () => {
    state.audioEnabled = !state.audioEnabled;
    setAudioPill();
    if (state.audioEnabled && state.hasStarted) {
      await playMusicForMode();
    } else {
      stopMusic();
    }
  });

  ui.toggleSpeed.addEventListener('click', () => {
    state.fastMode = !state.fastMode;
    syncModeVisuals();
  });

  ui.reducedFlash.addEventListener('change', (event) => {
    state.reducedFlash = event.target.checked;
  });

  ui.denseEffects.addEventListener('change', (event) => {
    state.denseEffects = event.target.checked;
    syncModeVisuals();
  });

  window.addEventListener('keydown', async (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      await triggerCtrlCMode();
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      if (!state.hasStarted) {
        await startSimulation('normal');
      } else {
        togglePause();
      }
    }
    if (event.key.toLowerCase() === 'n') nextScene();
    if (event.key.toLowerCase() === 'r') restartScene();
  });

  window.addEventListener('resize', syncResponsiveCanvas);
}

async function boot() {
  syncResponsiveCanvas();
  setAudioPill();
  syncModeVisuals();
  bindEvents();
  await loadData();
  requestAnimationFrame(frameLoop);
}

boot();
