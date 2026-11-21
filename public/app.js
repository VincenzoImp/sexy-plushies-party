(() => {
  const FALLBACK_REVEAL_AT = Date.parse('2026-11-21T19:00:00+01:00');
  const TZ = 'Europe/Rome';
  const KINDS = ['/assets/penguin.svg', '/assets/cookie.svg'];
  const MAX_SPRITES = 180;

  let revealAt = FALLBACK_REVEAL_AT;
  let skew = 0; // server time minus local time
  let revealed = false;
  let fetching = false;
  const now = () => Date.now() + skew;

  /* ---------------- spawning plushies ---------------- */
  const layer = document.getElementById('spawn-layer');
  const countEl = document.getElementById('spawn-count');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sprites = [];
  let spawned = 0;

  function spawn(x, y, opts = {}) {
    const size = opts.size ?? 34 + Math.random() * 46;
    const el = document.createElement('img');
    el.src = opts.kind ?? KINDS[Math.random() < 0.5 ? 0 : 1];
    el.className = 'sp';
    el.width = el.height = size;
    el.alt = '';
    layer.appendChild(el);
    const angle = opts.angle ?? -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const speed = opts.speed ?? 6 + Math.random() * 9;
    sprites.push({
      el, size, x: x - size / 2, y: y - size / 2,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      r: Math.random() * 360, vr: (Math.random() - 0.5) * 22,
      born: performance.now(), life: opts.life ?? 4200 + Math.random() * 2500, bounces: 0,
    });
    while (sprites.length > MAX_SPRITES) sprites.shift().el.remove();
    spawned++;
    countEl.textContent = spawned.toLocaleString('en');
  }

  function burst(x, y, n, opts) { for (let i = 0; i < n; i++) spawn(x, y, opts); }

  function rain(n, spread = 2500) {
    for (let i = 0; i < n; i++) {
      setTimeout(() => spawn(Math.random() * innerWidth, -60, { angle: Math.PI / 2, speed: 1 + Math.random() * 4 }), Math.random() * spread);
    }
  }

  function step(t) {
    const floor = innerHeight;
    for (let i = sprites.length - 1; i >= 0; i--) {
      const s = sprites[i];
      s.vy += 0.42; s.vx *= 0.995;
      s.x += s.vx; s.y += s.vy; s.r += s.vr;
      if (s.y + s.size > floor && s.vy > 0) {
        s.y = floor - s.size; s.vy *= -0.55; s.vx *= 0.8; s.vr *= 0.7; s.bounces++;
      }
      if (s.x < -s.size) s.x = innerWidth; else if (s.x > innerWidth) s.x = -s.size;
      const age = t - s.born;
      const fade = Math.max(0, Math.min(1, (s.life - age) / 700));
      s.el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg)`;
      s.el.style.opacity = fade;
      if (fade <= 0) { s.el.remove(); sprites.splice(i, 1); }
    }
    requestAnimationFrame(step);
  }
  if (!reduced) requestAnimationFrame(step);

  const isUI = (el) => el.closest('button, a, .cookie-banner');

  document.addEventListener('pointerdown', (e) => {
    if (reduced || isUI(e.target)) return;
    const onPhoto = e.target.closest('#photo');
    burst(e.clientX, e.clientY, onPhoto ? 16 : 7);
    if (onPhoto) {
      const p = document.getElementById('photo');
      p.classList.remove('squish'); void p.offsetWidth; p.classList.add('squish');
    }
  });

  let lastTrail = 0, lx = 0, ly = 0;
  document.addEventListener('pointermove', (e) => {
    if (reduced) return;
    const t = performance.now();
    const d = Math.hypot(e.clientX - lx, e.clientY - ly);
    if (t - lastTrail > 70 && d > 45) {
      lastTrail = t; lx = e.clientX; ly = e.clientY;
      spawn(e.clientX, e.clientY, { size: 22 + Math.random() * 18, speed: 2 + Math.random() * 3, life: 1600 });
    }
  });

  /* ---------------- cookie banner ---------------- */
  const banner = document.getElementById('cookie-banner');
  banner.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cookies]');
    if (!btn) return;
    const more = btn.dataset.cookies === '2';
    if (!reduced) rain(more ? 90 : 30, more ? 3500 : 2000);
    banner.classList.add('gone');
  });

  /* ---------------- clock + countdown ---------------- */
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  let prev = {};

  function setCell(id, v) {
    if (prev[id] === v) return;
    prev[id] = v;
    const el = $(id);
    el.textContent = v;
    el.parentElement.classList.remove('tick'); void el.offsetWidth; el.parentElement.classList.add('tick');
  }

  function tick() {
    $('clock').textContent = clockFmt.format(now());
    const left = Math.max(0, revealAt - now());
    const s = Math.floor(left / 1000);
    setCell('cd-h', pad(Math.floor(s / 3600)));
    setCell('cd-m', pad(Math.floor((s % 3600) / 60)));
    setCell('cd-s', pad(s % 60));
    if (left <= 0 && !revealed && !fetching) reveal(true);
  }

  /* ---------------- reveal ---------------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function showPlace(data, celebrate) {
    revealed = true;
    $('vault').classList.add('open');
    $('vault-state').textContent = 'unlocked';
    $('countdown-title').textContent = 'It is happening. Go go go.';
    $('countdown').classList.add('done');
    $('vault-body').innerHTML =
      `<p class="place">${esc(data.place)}</p>` +
      (data.note ? `<p class="vault-sub">${esc(data.note)}</p>` : '') +
      `<a class="btn btn-ink" href="${esc(data.maps)}" target="_blank" rel="noopener">Open in Maps</a>`;
    if (celebrate && !reduced) {
      rain(140, 4000);
      const r = $('vault').getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + 40, 30, { speed: 12 });
    }
  }

  async function reveal(celebrate) {
    fetching = true;
    const sent = Date.now();
    try {
      const res = await fetch('/api/reveal', { cache: 'no-store' });
      const data = await res.json();
      skew = data.now - (sent + Date.now()) / 2;
      if (data.revealAt) revealAt = data.revealAt;
      if (data.revealed) showPlace(data, celebrate);
      else if (revealAt - now() <= 0) setTimeout(() => reveal(celebrate), 2000);
    } catch {
      setTimeout(() => reveal(celebrate), 4000);
    } finally {
      fetching = false;
    }
  }

  reveal(false);
  tick();
  setInterval(tick, 250);
})();
