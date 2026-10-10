/* Operación Número 13 — escape room · interfaz */
(function () {
  'use strict';
  const X = window.Escape, G = X.Game, A = window.Aud, V3 = window.Viewer3D, T = window.Tarot;
  const { ROOMS, ITEMS, HS, DIFF, ACH } = X;
  const $ = (id) => document.getElementById(id);
  const IMG = { pepe: 'assets/personajes/pepe.png', jandro: 'assets/personajes/jandro.png' };
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let paused = true, dots = LS.get('on13_dots') !== '0', lastGained = null, modalOpen = false, cineOpen = false, cineEnd = null;
  let djOn = false, modalCleanup = null, usedQ = [], timerClicks = 0, catEl = null;

  /* ---------- Utilidades ---------- */
  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v);
    });
    kids.flat().forEach((c) => c != null && c !== false && n.append(c.nodeType ? c : document.createTextNode(c)));
    return n;
  }
  let toastT;
  function toast(msg, ms) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms || 2400);
  }
  const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const sfx = (k) => A.sfx(k);
  const lowTime = () => G.s && G.s.timeLeft <= Math.max(20, G.s.total * 0.15);

  /* ---------- Logros y récords (se guardan en el navegador) ---------- */
  const Meta = {
    d: { ach: {}, best: {}, endings: {}, plays: 0 },
    load() { try { const j = JSON.parse(LS.get('on13_meta') || 'null'); if (j) this.d = Object.assign(this.d, j); } catch (e) {} },
    save() { LS.set('on13_meta', JSON.stringify(this.d)); },
  };
  Meta.load();
  function achieve(id) {
    if (!ACH[id] || Meta.d.ach[id]) return;
    Meta.d.ach[id] = Date.now(); Meta.save();
    sfx('ach'); toast(`🏆 Logro: ${ACH[id].n}`, 3200);
  }

  /* ---------- Modales ---------- */
  function openModal(...content) {
    if (modalCleanup) { modalCleanup(); modalCleanup = null; }
    $('modalBox').replaceChildren(...content);
    $('modal').hidden = false; modalOpen = true; paused = true;
    const f = $('modalBox').querySelector('input, button'); if (f) f.focus();
  }
  function closeModal() {
    if (modalCleanup) { modalCleanup(); modalCleanup = null; }
    $('modal').hidden = true; modalOpen = false;
    paused = !G.s || !!G.s.over || $('game').hidden;
  }
  const closeBtn = (label) => h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { sfx('click'); closeModal(); } }, label || 'Cerrar'));

  function cardEl(id, big) {
    const it = ITEMS[id], c = it.card;
    return h('div', { class: 'tarot' + (big ? ' big' : '') + (c.inv ? ' inv' : '') },
      h('div', { class: 'n' }, c.num), h('div', { class: 's' }, c.sym), h('div', { class: 'c' }, it.n));
  }
  function itemEl(id, big) {
    const it = ITEMS[id];
    if (it.card) return cardEl(id, big);
    if (it.emoji) return h('span', { class: 'emoji' + (big ? ' big' : ''), 'aria-label': it.n }, it.emoji);
    return h('img', { src: `assets/objetos/${id}.png`, alt: it.n });
  }
  function spriteEl(sp, name) {
    return /^[a-z_0-9]+$/.test(sp) ? h('img', { class: 'sp', src: `assets/objetos/${sp}.png`, alt: name }) : h('span', { class: 'sp emoji', 'aria-hidden': 'true' }, sp);
  }

  /* ---------- API de interfaz para el motor ---------- */
  const UI = {
    sfx, achieve,
    gained(id) { lastGained = id; sfx('gain'); toast(`Has conseguido: ${ITEMS[id].n}`); },
    say(text, who) {
      $('say').classList.toggle('jandro', who === 'jandro');
      $('sayAva').src = IMG[who === 'jandro' ? 'jandro' : 'pepe'];
      $('sayText').textContent = text;
      sfx('click');
    },
    read(title, text, item, sub, kind) {
      const kids = [h('h2', {}, title)]; let pending3d = null;
      if (item) {
        const pic = h('div', { class: 'pic' }, itemEl(item, true));
        const view = h('div', { class: 'itemview' }, pic, h('p', {}, sub || (ITEMS[item].read ? ITEMS[item].d : '')));
        kids.push(view);
        if (V3 && V3.has(item)) pending3d = { pic, item };
      }
      if (kind === 'pista') kids.push(h('p', {}, '🔮 La bola de cristal de Jandro (de plástico) susurra:'));
      kids.push(h('div', { class: 'letter' }, text), closeBtn('Entendido'));
      openModal(...kids);
      if (pending3d) { // visor 3D: arrastra para girar
        const { pic, item: it } = pending3d; pic.classList.add('is3d');
        let viewer = null, dead = false;
        V3.mount(pic, it).then((v) => {
          if (dead) { if (v) v.dispose(); return; }
          if (v) { viewer = v; pic.querySelectorAll(':scope > :not(canvas)').forEach((e) => e.remove()); pic.append(h('span', { class: 'v3hint' }, '↺ arrastra')); }
        });
        modalCleanup = () => { dead = true; if (viewer) viewer.dispose(); };
      }
      sfx('open');
    },
    keypad({ title, prompt, answer, onOk, onFail }) {
      let val = '';
      const disp = h('div', { class: 'display' }), keys = h('div', { class: 'keys' });
      const draw = () => disp.replaceChildren(...[...answer].map((_, i) => h('div', { class: 'd' }, val[i] || '·')));
      const press = (d) => {
        if (val.length >= answer.length) return;
        val += d; draw(); sfx('click');
        if (val.length === answer.length) {
          if (val === answer) { closeModal(); sfx('open'); onOk(); UI.refresh(); }
          else { closeModal(); onFail(); }
        }
      };
      [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((d) => keys.append(h('button', { class: 'btn', onclick: () => press(String(d)) }, d)));
      keys.append(h('button', { class: 'btn dark', onclick: () => { val = val.slice(0, -1); draw(); } }, '⌫'), h('button', { class: 'btn', onclick: () => press('0') }, '0'));
      draw();
      openModal(h('h2', {}, title), h('p', {}, prompt), disp, keys, h('div', { class: 'row' }, h('button', { class: 'btn dark', onclick: closeModal }, 'Cancelar')));
    },
    textInput({ title, prompt, answer, onOk, onFail }) {
      const inp = h('input', { class: 'field', type: 'text', maxlength: String(answer.length + 4), autocomplete: 'off', spellcheck: 'false', 'aria-label': prompt });
      const go = () => {
        const v = inp.value.trim().toLowerCase(); if (!v) return;
        if (v === answer) { closeModal(); sfx('open'); onOk(); UI.refresh(); } else { closeModal(); onFail(); }
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      openModal(h('h2', {}, title), h('p', {}, prompt), inp,
        h('div', { class: 'row' }, h('button', { class: 'btn dark', onclick: closeModal }, 'Cancelar'), h('button', { class: 'btn', onclick: go }, 'Entrar')));
      inp.focus();
    },
    ordered({ title, prompt, order, labels, onOk, onFail }) { // colocar objetos en orden (pociones o cartas)
      let chosen = [];
      const slots = h('div', { class: 'slots' }), pick = h('div', { class: 'pick' });
      const draw = () => {
        slots.replaceChildren(...order.map((_, i) => h('div', { class: 'slotbox', onclick: () => { chosen.splice(i, 1); draw(); } },
          h('span', { class: 'nn' }, labels[i]), chosen[i] ? itemEl(chosen[i]) : null)));
        pick.replaceChildren(...order.filter((id) => G.s.inv.includes(id)).map((id) => h('button', { class: 'slot' + (chosen.includes(id) ? ' used' : ''), title: ITEMS[id].n, onclick: () => {
          if (chosen.includes(id) || chosen.length >= order.length) return;
          chosen.push(id); sfx('click'); draw();
          if (chosen.length === order.length) setTimeout(check, 350);
        } }, itemEl(id), h('span', { class: 'cap' }, ITEMS[id].n))));
      };
      const check = () => { if (chosen.every((c, i) => c === order[i])) { closeModal(); sfx('magic'); onOk(); UI.refresh(); } else { closeModal(); onFail(); } };
      draw();
      openModal(h('h2', {}, title), h('p', {}, prompt), slots, pick,
        h('div', { class: 'row' }, h('button', { class: 'btn dark', onclick: () => { chosen = []; draw(); } }, 'Vaciar'), h('button', { class: 'btn dark', onclick: closeModal }, 'Cancelar')));
    },
    potions(o) { UI.ordered({ title: 'Repisa de los frascos', prompt: 'Tres huecos con forma de frasco. Recuerda la nota de voz: ¿qué orden te dio Jandro?', order: o.order, labels: ['1.º', '2.º', '3.º'], onOk: o.onOk, onFail: o.onFail }); },
    finalTable(o) { UI.ordered({ title: 'La mesa de tapete fucsia', prompt: 'Coloca las tres cartas en el orden de la lectura (lo leíste con la lupa en la carta astral). Toca una carta para ponerla; toca un hueco para quitarla.', order: o.order, labels: ['1.º', '2.º', '3.º'], onOk: o.onOk, onFail: o.onFail }); },
    trick: (o) => playTrick(o),
    toggleJazz() { djOn = !djOn; sfx('door'); return djOn; }, // gag del pinchadiscos (sin música)
    piano() { A.piano(); },
    refresh() { render(); },
    cine(key, done, extra) { playCine(key, done, extra); },
    end(r) { showEnd(r); },
  };
  G.bind(UI);

  /* ---------- Render ---------- */
  function render() {
    if (!G.s) return;
    const s = G.s, g = G.api;
    const t = $('timer'); t.textContent = fmt(s.timeLeft); t.classList.toggle('low', lowTime());
    $('hintCost').textContent = s.freeHints > 0 ? `gratis ×${s.freeHints}` : `−0:${String(X.HINT_COST).padStart(2, '0')}`;
    $('btnTarot').hidden = !G.tarotAvailable();
    $('tarotLeft').textContent = G.s.inv.includes('cartas') ? G.tarotLeft() : '';
    // objetivo
    const tvFirst = !g.flag('tv');
    $('goal').replaceChildren(
      h('div', { class: 'txt' }, h('b', {}, 'Tu objetivo'), tvFirst ? '¡La tele del salón se ha encendido sola! Haz clic en ella para saber qué quiere Jandro.' : G.objective()),
      h('div', { class: 'chips' },
        ...X.CARDS.map((c) => h('span', { class: 'chip' + (g.has(c) ? ' on' : '') }, g.has(c) ? '✔' : '✖', ITEMS[c].n)),
        h('span', { class: 'chip' + (g.has('policia') ? ' on' : '') }, g.has('policia') ? '✔' : '✖', 'Gorra'),
        h('span', { class: 'chip' + (g.flag('mesa_resuelta') ? ' on' : '') }, g.flag('mesa_resuelta') ? '✔' : '✖', 'Pasadizo')));
    // pestañas
    const hidden = ['jardin', 'coche', 'pasadizo'];
    $('tabs').replaceChildren(...ROOMS.filter((r) => !hidden.includes(r.id) || s.unlocked[r.id]).map((r) => {
      const pend = s.unlocked[r.id] ? G.pending(r.id) : 0;
      return h('button', { class: 'tab' + (s.room === r.id ? ' active' : '') + (s.unlocked[r.id] ? '' : ' locked'), onclick: () => { sfx('door'); G.goRoom(r.id); } },
        s.unlocked[r.id] ? '' : '🔒 ', r.n, pend ? h('span', { class: 'badge', title: 'Cosas por revisar' }, pend) : null);
    }));
    // escena
    const sc = $('scene'), room = ROOMS.find((r) => r.id === s.room), view = X.VIEW[s.room] || 'normal';
    sc.className = 'scene view-' + view;
    const kids = [], hsKids = [];
    if (view === 'normal') kids.push(h('img', { class: 'bg', src: `assets/fondos/${X.BG[s.room]}.jpg`, alt: '' }));
    kids.push(h('div', { class: 'rname' }, room.n));
    [...HS[s.room]].sort((a, b) => b.box[2] * b.box[3] - a.box[2] * a.box[3]).forEach((hs) => {
      const done = hs.done ? hs.done(g) : false;
      hsKids.push(h('button', {
        class: 'hs' + (done ? ' done' : '') + (hs.done ? '' : ' deco') + (hs.box[1] < 14 ? ' top-edge' : '') + (hs.sprite ? ' has-sp' : ''), 'data-name': hs.n, 'aria-label': hs.n,
        style: `left:${hs.box[0]}%;top:${hs.box[1]}%;width:${hs.box[2]}%;height:${hs.box[3]}%`,
        onclick: () => G.click(s.room, hs.id),
      }, hs.sprite ? spriteEl(hs.sprite, hs.n) : null));
    });
    if (view === 'garden') kids.push(...gardenKids(true), ...hsKids);
    else if (view === 'closeup') kids.push(h('div', { class: 'carbg' }), h('div', { class: 'cardash' }), ...hsKids);
    else if (view === 'velvet') kids.push(h('div', { class: 'vcurt l' }), h('div', { class: 'vcurt r' }), h('img', { class: 'vjandro', src: IMG.jandro, alt: '' }), h('div', { class: 'vtable' }, h('span', {}, '🃏 🎩 🃏')), ...hsKids);
    else kids.push(...hsKids);
    sc.replaceChildren(...kids);
    document.body.classList.toggle('dots', dots);
    $('btnDots').setAttribute('aria-pressed', String(dots));
    document.body.classList.toggle('using', !!s.sel);
    // inventario
    const inv = $('inv');
    if (!s.inv.length) inv.replaceChildren(h('span', { class: 'empty-hint' }, 'Vacío. Explora la casa: haz clic en muebles y objetos.'));
    else inv.replaceChildren(...s.inv.map((id) => h('button', {
      class: 'slot' + (s.sel === id ? ' sel' : '') + (lastGained === id ? ' new' : ''), title: ITEMS[id].n, 'aria-label': ITEMS[id].n, 'aria-pressed': String(s.sel === id),
      onclick: () => { sfx('click'); G.select(id); },
    }, itemEl(id), h('span', { class: 'cap' }, ITEMS[id].n))));
    lastGained = null;
    $('using').textContent = s.sel ? `Usando: ${ITEMS[s.sel].n} → haz clic en algo de la sala.` : (s.inv.length ? 'Selecciona un objeto para usarlo en la sala.' : '');
    $('btnExamine').disabled = !s.sel; $('btnDrop').disabled = !s.sel;
    $('proofs').textContent = `🔍 Pruebas ${G.pruebas()}/${X.PRUEBAS.length}`;
  }

  /* ---------- Plano de la casa ---------- */
  const CROP = {
    car:   { box: [75, 56, 22, 28], bg: [698, 640, 244, 220] },
    chair: { box: [78, 26, 9, 15], bg: [345, 735, 95, 100] },
    tree:  { box: [87, 5, 11, 19], bg: [915, 515, 109, 135] },
    bush:  { box: [51, 90, 11, 9], bg: [200, 615, 90, 75] },
    bush2: { box: [1, 30, 6, 10], bg: [200, 615, 90, 75] },
  };
  function cropEl(k) {
    const c = CROP[k], [x, y, w, hh] = c.bg, N = 1024;
    return h('div', { class: 'crop', style: `left:${c.box[0]}%;top:${c.box[1]}%;width:${c.box[2]}%;height:${c.box[3]}%;background-size:${(N / w) * 100}% ${(N / hh) * 100}%;background-position:${(x / (N - w)) * 100}% ${(y / (N - hh)) * 100}%` });
  }
  function gardenKids(nav) {
    const s = G.s, P = X.PLAN, kids = [h('div', { class: 'grass' })];
    Object.keys(CROP).forEach((k) => kids.push(cropEl(k)));
    kids.push(h('div', { class: 'house', style: `left:${P.house[0]}%;top:${P.house[1]}%;width:${P.house[2]}%;height:${P.house[3]}%` }));
    kids.push(h('div', { class: 'path', style: `left:${P.entrance[0] - 4}%;top:${P.entrance[1]}%` }));
    Object.entries(P.rooms).forEach(([id, b]) => {
      const room = ROOMS.find((r) => r.id === id), open = s.unlocked[id], pend = open ? G.pending(id) : 0, here = s.room === id;
      const cls = 'tile' + (here ? ' here' : '') + (open ? '' : ' locked') + (open && !pend ? ' clear' : '');
      kids.push(h(nav ? 'button' : 'div', Object.assign({
        class: cls, style: `left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%;background-image:url(assets/fondos/${X.BG[id]}.jpg)`,
        'aria-label': room.n + (open ? '' : ' (cerrada)'),
      }, nav ? { onclick: () => { sfx('door'); G.goRoom(id); } } : {}),
        h('span', { class: 'tn' }, room.n),
        h('span', { class: 'ts' }, !open ? '🔒' : pend ? h('b', { title: 'Cosas por revisar' }, pend) : '✓'),
        here ? h('span', { class: 'me' }, '🧓') : null));
    });
    P.doors.forEach((d) => kids.push(h('div', { class: 'door', style: `left:${d[2]}%;top:${d[3]}%` })));
    return kids;
  }
  function showMap() {
    const s = G.s; if (!s || s.over || modalOpen) return;
    const outside = ['jardin', 'coche', 'pasadizo'].includes(s.room);
    const box = h('div', { class: 'scene view-garden minimap' }, ...gardenKids(true));
    openModal(h('h2', {}, 'Mapa de la casa'),
      h('p', {}, 'Toca una sala para ir a ella. El número rosa son las cosas que te quedan por revisar; ✓ significa que ya la has resuelto; 🔒 está cerrada.'),
      box,
      h('div', { class: 'row' },
        s.unlocked.jardin ? h('button', { class: 'btn alt', onclick: () => { closeModal(); G.goRoom('jardin'); } }, outside ? 'Estás fuera' : 'Salir al jardín') : null,
        h('button', { class: 'btn', onclick: closeModal }, 'Cerrar')));
    box.addEventListener('click', (e) => { if (e.target.closest('.tile')) closeModal(); });
  }

  /* ---------- Minijuego: lectura de tarot ---------- */
  function playTarot() {
    if (!G.tarotAvailable()) return;
    const spread = T.ARCANOS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const labels = ['Pasado', 'Presente', 'Futuro'];
    let score = 0, done = 0, busy = false;
    const fc = spread.map((a, i) => h('button', { class: 'fc', 'aria-label': `Carta del ${labels[i]}`, onclick: () => flip(i) },
      h('div', { class: 'fc-in' },
        h('div', { class: 'fc-b' }, h('span', {}, '✦'), h('small', {}, labels[i])),
        h('div', { class: 'fc-f' }, h('div', { class: 'n' }, a.num), h('div', { class: 's' }, a.sym), h('div', { class: 'c' }, a.n)))));
    const qbox = h('div', { class: 'qbox' }), pips = h('div', { class: 'pips' });
    const results = [];
    const drawPips = () => pips.replaceChildren(...[0, 1, 2].map((i) => h('span', { class: 'pip' + (results[i] === true ? ' ok' : results[i] === false ? ' ko' : '') })));
    const finish = () => {
      const msg = G.readingDone(score);
      qbox.replaceChildren(h('p', { class: 'fortune big' }, `Aciertos: ${score}/3`), h('p', {}, msg), h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { sfx('click'); closeModal(); } }, 'Gracias, Jandro')));
    };
    function flip(i) {
      if (busy || fc[i].classList.contains('flip')) return;
      busy = true; fc[i].classList.add('flip'); sfx('flip');
      let qi; do { qi = Math.floor(Math.random() * T.BANK.length); } while (usedQ.includes(qi) && usedQ.length < T.BANK.length);
      usedQ.push(qi); if (usedQ.length > 20) usedQ.shift();
      const q = T.BANK[qi], order = [0, 1, 2].sort(() => Math.random() - 0.5), opts = h('div', { class: 'opts' });
      let correct;
      order.forEach((idx) => {
        const b = h('button', { class: 'btn opt', onclick: () => answer(idx === q.a, b) }, q.o[idx]);
        if (idx === q.a) correct = b;
        opts.append(b);
      });
      const answer = async (ok, btn) => {
        [...opts.children].forEach((b) => (b.disabled = true));
        btn.classList.add(ok ? 'right' : 'wrong'); if (!ok) correct.classList.add('right');
        sfx(ok ? 'gain' : 'fail');
        if (ok) score++;
        results.push(ok); done++; drawPips();
        qbox.replaceChildren(h('p', { class: 'fortune' }, h('b', {}, `${spread[i].n}: `), ok ? spread[i].ok : spread[i].ko));
        await sleep(300);
        if (done === 3) { await sleep(1600); finish(); } else { qbox.append(h('p', { class: 'hintline' }, 'Gira otra carta...')); busy = false; }
      };
      qbox.replaceChildren(h('p', { class: 'q' }, h('b', {}, `${labels[i]} · ${spread[i].n}. `), q.q), opts);
    }
    drawPips();
    openModal(h('h2', {}, `Lectura de tarot (${G.s.readings + 1}/${X.MAX_READINGS})`),
      h('p', {}, 'Jandro baraja con cara de pitoniso: «Tres cartas, tres preguntas. Si aciertas, el tarot te sonríe. Si fallas... ya sabes, martes 13.»'),
      h('div', { class: 'spread' }, ...fc), pips, qbox,
      h('div', { class: 'row' }, h('button', { class: 'btn dark', onclick: closeModal }, 'Salir (no cuenta)')));
  }

  /* ---------- Minijuego final: el último truco de Jandro ---------- */
  function playTrick(o) {
    const defs = [{ id: 'mago', n: 'El Mago', sym: '🎩', num: 'I' }, { id: 'muerte', n: 'La Muerte', sym: '💀', num: 'XIII' }, { id: 'diablo', n: 'El Diablo', sym: '😈', num: 'XV' }];
    const D = { relajado: { swaps: 5, ms: 520 }, normal: { swaps: 7, ms: 400 }, reto: { swaps: 10, ms: 290 } }[o.diff] || { swaps: 7, ms: 400 };
    let alive = true, state = 'ready', slot = {}, used = { mark: false, ring: false, mirror: false }, out = null;
    const mk = (d) => h('button', { class: 'tcard', 'data-id': d.id, 'aria-label': 'Carta', disabled: true, onclick: () => pick(d.id) },
      h('div', { class: 'tin' }, h('div', { class: 'tb' }, h('span', { class: 'mark' }, '✦'), '🂠'), h('div', { class: 'tf' }, h('div', { class: 'n' }, d.num), h('div', { class: 's' }, d.sym), h('div', { class: 'c' }, d.n))));
    const els = {}; defs.forEach((d) => (els[d.id] = mk(d)));
    const area = h('div', { class: 'trick' }, ...defs.map((d) => els[d.id]));
    const msg = h('p', { class: 'trickmsg' }, 'Jandro: «Un truco muy sencillo, Pepe. Sigue al Mago con la mirada... si puedes.»');
    const place = () => defs.forEach((d) => els[d.id].style.setProperty('--i', slot[d.id]));
    const btnStart = h('button', { class: 'btn go', onclick: () => start() }, '¡Que empiece el truco!');
    const aidMark = o.aids.cartas ? h('button', { class: 'btn small alt', onclick: () => { used.mark = true; area.classList.add('marked'); aidMark.disabled = true; sfx('magic'); msg.textContent = 'La baraja marcada deja una señal en la carta del Mago... si sabes mirar.'; } }, '🃏 Marcar con la baraja') : null;
    const aidRing = o.aids.joya ? h('button', { class: 'btn small alt', disabled: true, onclick: () => ring() }, '💍 Distraer con el anillo') : null;
    const aidMir = o.aids.espejo ? h('button', { class: 'btn small alt', disabled: true, onclick: () => mirror() }, '🪞 Enseñarle el espejo') : null;
    const secret = o.aids.loco ? h('button', { class: 'btn small dark', onclick: () => { alive = false; closeModal(); o.onSecret(); } }, '🃏 Jugar la carta El Loco') : null;
    const setAids = (en) => { if (aidRing && !used.ring) aidRing.disabled = !en; if (aidMir && !used.mirror) aidMir.disabled = !en; };
    function ring() {
      used.ring = true; aidRing.disabled = true; sfx('ding');
      const wrong = defs.filter((d) => d.id !== 'mago' && !els[d.id].classList.contains('out'));
      const d = wrong[Math.floor(Math.random() * wrong.length)]; els[d.id].classList.add('out'); els[d.id].disabled = true;
      msg.textContent = 'Jandro se queda mirando el anillo con ojos de dinero y una carta cae al suelo: ¡esa no es la del Mago!';
    }
    async function mirror() {
      used.mirror = true; aidMir.disabled = true; sfx('magic');
      msg.textContent = 'Jandro ve su reflejo y se atusa el bigote... un instante. ¡Mira rápido!';
      els.mago.classList.add('up'); await sleep(750); if (!alive) return; els.mago.classList.remove('up');
    }
    async function start() {
      if (state === 'busy') return; state = 'busy';
      btnStart.disabled = true; setAids(false); Object.values(els).forEach((e) => { e.classList.remove('up', 'out'); e.disabled = true; });
      const perm = [0, 1, 2].sort(() => Math.random() - 0.5); defs.forEach((d, i) => (slot[d.id] = perm[i])); place();
      area.classList.toggle('marked', used.mark);
      msg.textContent = 'Mira bien al Mago...'; Object.values(els).forEach((e) => e.classList.add('up')); await sleep(1500); if (!alive) return;
      Object.values(els).forEach((e) => e.classList.remove('up')); await sleep(600); if (!alive) return;
      msg.textContent = 'Jandro baraja con las dos manos...'; sfx('shuffle');
      for (let k = 0; k < D.swaps && alive; k++) {
        let a = Math.floor(Math.random() * 3), b; do { b = Math.floor(Math.random() * 3); } while (b === a);
        const ia = defs.find((d) => slot[d.id] === a).id, ib = defs.find((d) => slot[d.id] === b).id;
        slot[ia] = b; slot[ib] = a; place(); if (k % 2 === 0) sfx('flip');
        await sleep(D.ms + 80);
      }
      if (!alive) return;
      state = 'pick'; msg.textContent = '¿Dónde está El Mago? Elige una carta.';
      Object.values(els).forEach((e) => { if (!e.classList.contains('out')) e.disabled = false; }); setAids(true);
    }
    async function pick(id) {
      if (state !== 'pick') return; state = 'busy';
      Object.values(els).forEach((e) => (e.disabled = true)); setAids(false);
      els[id].classList.add('up'); sfx('flip');
      if (id === 'mago') {
        msg.textContent = '¡El Mago! Jandro se queda de piedra: «Eso... eso no estaba en el guion.»'; sfx('win');
        const n = (used.mark ? 1 : 0) + (used.ring ? 1 : 0) + (used.mirror ? 1 : 0);
        await sleep(1700); if (!alive) return; alive = false; closeModal(); o.onWin(n);
      } else {
        sfx('fail'); msg.textContent = `Jandro: «¡${defs.find((d) => d.id === id).n}! Esa no era mi carta, Pepe.» (Pierdes unos segundos.)`;
        els.mago.classList.add('up'); await sleep(1700); if (!alive) return;
        alive = false; closeModal(); o.onFail(); // la penalización la aplica el motor; se puede volver a intentar
      }
    }
    defs.forEach((d, i) => (slot[d.id] = i)); place();
    openModal(h('h2', {}, 'El último truco de Jandro'),
      h('p', {}, 'Jandro baraja tres cartas sobre el tapete fucsia. Si encuentras a El Mago, queda detenido. Usa lo que has ido reuniendo por la casa:'),
      h('div', { class: 'row aids' }, aidMark, aidRing, aidMir), area, msg,
      h('div', { class: 'row' }, btnStart, secret, h('button', { class: 'btn dark', onclick: () => { alive = false; closeModal(); } }, 'Ahora no')));
    modalCleanup = () => { alive = false; };
  }

  /* ---------- Escenas (cinemáticas) ---------- */
  function playCine(key, done, extra) {
    const modalWas = modalOpen; if (modalWas) $('modal').hidden = true;
    const beats = window.Scenes.get(key, G.s, extra);
    const stage = $('cstage'), cname = $('cname'), ctext = $('ctext'), root = $('cine');
    cineOpen = true; paused = true; root.hidden = false;
    let i = -1, timer = null, full = '';
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true; root.onclick = null; $('cskip').onclick = null;
      clearInterval(timer); root.hidden = true; cineOpen = false; cineEnd = null;
      if (modalWas) $('modal').hidden = false;
      paused = modalWas ? true : !(G.s && !G.s.over && !$('game').hidden);
      if (done) done();
    };
    cineEnd = finish;
    const bgEl = (bg) => {
      if (bg === 'room') bg = G.s.room;
      if (bg === 'finca') return h('div', { class: 'cbg finca' }, h('img', { src: 'assets/fondos/plano.jpg', alt: '' }));
      if (bg === 'velvet') return h('div', { class: 'cbg velvet' });
      if (bg === 'black') return h('div', { class: 'cbg black' });
      return h('div', { class: 'cbg room' }, h('img', { src: `assets/fondos/${X.BG[bg] || 'salon'}.jpg`, alt: '' }));
    };
    const show = () => {
      const b = beats[i];
      stage.className = 'cstage' + (b.fx ? ' fx-' + b.fx : '');
      const kids = [bgEl(b.bg)];
      const char = (who, side, ghost) => h('img', { class: `cchar ${side}` + (ghost ? ' ghost' : '') + (b.who && b.who !== who ? ' dim' : '') + (b.who === who ? ' talk' : ''), src: IMG[who], alt: who === 'pepe' ? 'Pepe' : 'Jandro' });
      if (b.l) kids.push(char(b.l, 'l', false));
      if (b.r) kids.push(char(b.r, 'r', b.ghost));
      if (b.card) kids.push(h('div', { class: 'ccard' }, h('div', { class: 'tarot big' + (b.card.inv ? ' inv' : '') }, h('div', { class: 'n' }, b.card.num), h('div', { class: 's' }, b.card.sym), h('div', { class: 'c' }, b.card.n))));
      stage.replaceChildren(...kids);
      if (b.fx === 'flash') stage.append(h('div', { class: 'cflash' }));
      if (b.fx === 'shake') sfx('door'); else if (b.fx === 'smoke' || b.fx === 'vanish') sfx('magic');
      cname.textContent = b.who === 'pepe' ? 'Pepe' : b.who === 'jandro' ? 'Jandro' : '';
      $('ccap').className = 'ccap ' + (b.who || 'narr');
      full = b.text; ctext.textContent = ''; let n = 0; clearInterval(timer);
      timer = setInterval(() => { n += 2; ctext.textContent = full.slice(0, n); if (n >= full.length) { clearInterval(timer); timer = null; } }, 22);
      $('cnext').textContent = i === beats.length - 1 ? '▶ Continuar' : '▶';
    };
    const advance = () => {
      if (timer) { clearInterval(timer); timer = null; ctext.textContent = full; return; }
      sfx('click'); i++;
      if (i >= beats.length) return finish();
      show();
    };
    root.onclick = (e) => { if (e.target.id !== 'cskip') advance(); };
    $('cskip').onclick = (e) => { e.stopPropagation(); finish(); };
    advance();
  }

  /* ---------- Pantallas ---------- */
  function showRules(onClose) {
    openModal(h('h2', {}, 'Cómo se juega'),
      h('ul', { html:
        `<li><b>Haz clic</b> en muebles y objetos de la sala. Los puntos amarillos (👁) te muestran lo que aún no has resuelto. Con 🗺 viajas entre salas.</li>
         <li>Lo que cojas va a tu <b>inventario</b>. <b>Selecciónalo</b> y haz clic en algo de la sala para <b>usarlo</b> (la lupa en una carta astral, el cuchillo en un puf…).</li>
         <li><b>Examina</b> los objetos: muchos esconden pistas y se pueden <b>girar en 3D</b>.</li>
         <li>El tiempo vuela: <b>10, 6 o 3 minutos</b> según la dificultad. Fallar un código o un orden te quita unos segundos.</li>
         <li>¿Atascado? Pide una <b>pista</b> 🔮: cuesta solo <b>30 segundos</b> (el botiquín del baño regala una gratis).</li>
         <li>Con la baraja marcada puedes pedirle a Jandro una <b>lectura de tarot</b> 🃏: acierta y ganarás tiempo o una pista.</li>
         <li>Al final, Jandro te espera en el pasadizo con un último truco.</li>
         <li>Hay <b>🏆 logros</b>, <b>pruebas de la estafa</b> (🔍), un <b>final secreto</b> y muchos guiños al corto. Mira bien a tu alrededor... y a ese gato.</li>`
      }), h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { sfx('click'); closeModal(); if (onClose) onClose(); } }, onClose ? '¡A jugar!' : 'Vale')));
  }
  function showAchievements() {
    const d = Meta.d, ids = Object.keys(ACH), got = ids.filter((i) => d.ach[i]).length;
    const rec = (k) => (d.best[k] ? `${fmt(d.best[k].timeLeft)} · ${'★'.repeat(d.best[k].stars)}${'☆'.repeat(3 - d.best[k].stars)}` : '—');
    openModal(h('h2', {}, `Logros (${got}/${ids.length})`),
      h('div', { class: 'ach-list' }, ...ids.map((i) => h('div', { class: 'ach' + (d.ach[i] ? ' on' : '') },
        h('span', { class: 'ai' }, d.ach[i] ? ACH[i].i : '🔒'), h('div', {}, h('b', {}, d.ach[i] || !ACH[i].secret ? ACH[i].n : '???'), h('small', {}, ACH[i].d))))),
      h('h2', { class: 'sub' }, 'Récords (tiempo restante)'),
      h('div', { class: 'stats' }, ...Object.keys(DIFF).map((k) => h('span', {}, `${DIFF[k].n} `, h('b', {}, rec(k))))),
      h('div', { class: 'stats' }, h('span', {}, 'Partidas ', h('b', {}, d.plays)), h('span', {}, 'Detenido ', h('b', {}, d.endings.normal || 0)), h('span', {}, 'Secreto ', h('b', {}, d.endings.secret || 0)), h('span', {}, 'Derrotas ', h('b', {}, d.endings.lose || 0))),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { sfx('click'); showTitle(); } }, 'Volver')));
  }
  function showTitle() {
    paused = true; $('game').hidden = true; $('timer').classList.add('hidden'); $('btnTarot').hidden = true;
    const saved = G.loadSaved();
    const start = (k) => { sfx('click'); A.unlock(); G.clearSave(); G.start(k); djOn = false; closeModal(); playCine('intro', () => showRules(() => begin(true))); };
    openModal(h('div', { class: 'title-screen' },
      h('div', { class: 'tag' }, 'Un escape room basado en el cortometraje de Carlos Ballesteros'),
      h('div', { class: 'poster', html: '<span class="big">O</span>PERACIÓN<br>NÚMERO <span class="n13">13</span>' }),
      h('p', {}, 'Jandro ha desaparecido por arte de magia. Ha dejado una carta, una casa llena de trucos y un reloj en marcha. ¿Podrás encontrarlo?'),
      saved && !saved.over ? h('div', { class: 'row' }, h('button', { class: 'btn go', onclick: () => { A.unlock(); G.restore(saved); begin(false); } }, `Continuar partida (${fmt(saved.timeLeft)})`)) : null,
      h('div', { class: 'diffs' }, ...Object.keys(DIFF).map((k) => h('button', { class: 'diff', onclick: () => start(k) },
        h('b', {}, DIFF[k].n), h('span', {}, `${DIFF[k].min} min`),
        h('small', {}, k === 'relajado' ? 'Para disfrutar de la casa' : k === 'normal' ? 'La experiencia recomendada' : 'Solo para expertos del 13'),
        h('small', { class: 'best' }, Meta.d.best[k] ? `Récord ${fmt(Meta.d.best[k].timeLeft)}` : 'Sin récord')))),
      h('div', { class: 'row' }, h('button', { class: 'btn dark', onclick: () => showRules() }, 'Cómo se juega'), h('button', { class: 'btn dark', onclick: showAchievements }, '🏆 Logros y récords'))));
  }
  function begin(fresh) {
    $('game').hidden = false; $('timer').classList.remove('hidden'); closeModal();
    paused = false; render();
    if (fresh) UI.say('Silencio. La casa vacía y una carta sobre la mesa... ¿Y esa luz? La tele se ha encendido sola.');
    else UI.say('Sigues en la casa de Pepe. El reloj no espera.');
    scheduleCat();
  }

  function showEnd(r) {
    paused = true; sfx(r.win ? 'win' : 'fail');
    let isRecord = false;
    Meta.d.plays++;
    Meta.d.endings[r.win ? (r.secret ? 'secret' : 'normal') : 'lose'] = (Meta.d.endings[r.win ? (r.secret ? 'secret' : 'normal') : 'lose'] || 0) + 1;
    if (r.win) {
      const b = Meta.d.best[r.diff];
      if (!b || r.timeLeft > b.timeLeft) { Meta.d.best[r.diff] = { timeLeft: Math.round(r.timeLeft), stars: r.stars }; isRecord = true; }
      if (r.hints === 0) achieve('sin_pistas');
      if (r.timeLeft > r.total * 0.6) achieve('rapido');
      if (r.pruebas === r.totalPruebas) achieve('detective');
      if (r.secret) achieve('secreto');
      if (!r.secret && r.aids === 0) achieve('mago');
      if (r.stars === 3 && r.diff === 'reto') achieve('perfecto');
    }
    Meta.save();
    const stars = r.win ? h('div', { class: 'stars' }, ...[1, 2, 3].map((i) => h('span', { class: i <= r.stars ? '' : 'off' }, '★'))) : null;
    const card = h('div', { class: 'bigcard' }, h('div', {}, r.win ? (r.secret ? '0' : 'XI') : '0'), h('img', { src: IMG.pepe, alt: '' }), h('div', { class: 'cn' }, r.win ? (r.secret ? 'EL LOCO' : 'LA JUSTICIA') : 'EL LOCO'));
    const text = r.win && r.secret
      ? 'Jandro quiso jugar su truco... y Pepe jugó la carta que nunca ve venir nadie. Ahora el mago es una carta más sobre el tapete fucsia, y el que sonríe es Pepe. Operación Número 13: completada.'
      : r.win
        ? 'Con la gorra bien puesta, Pepe adivina dónde estaba El Mago, y Jandro se queda sin truco. Esposas, peineta y «Puto gato». (Y a Pepe, por una vez, no se le caen los pantalones.)'
        : 'Se acaba el tiempo. Un humo violeta llena el salón y, cuando se disipa, solo queda una carta sobre el tapete fucsia: EL LOCO. Jandro agarra la carta y desaparece. Otra vez. «Operación Número 13... completada.»';
    const best = Meta.d.best[r.diff];
    openModal(h('div', { class: 'end' },
      h('h2', {}, r.win ? '¡Alto, Guardia Civil!' : 'Jandro se ha salido con la suya'),
      r.secret ? h('div', { class: 'secret' }, '🃏 FINAL SECRETO: EL LOCO') : null, isRecord ? h('div', { class: 'secret rec' }, '⏱ ¡NUEVO RÉCORD!') : null,
      stars, card, h('p', {}, text),
      h('div', { class: 'stats' },
        r.win ? h('span', {}, 'Tiempo restante ', h('b', {}, fmt(r.timeLeft))) : h('span', {}, 'Cartas ', h('b', {}, `${r.cards}/3`)),
        h('span', {}, 'Pistas ', h('b', {}, r.hints)),
        h('span', {}, 'Pruebas ', h('b', {}, `${r.pruebas}/${r.totalPruebas}`)),
        best ? h('span', {}, 'Récord ', h('b', {}, fmt(best.timeLeft))) : null),
      h('div', { class: 'row' },
        h('button', { class: 'btn go', onclick: () => { closeModal(); showTitle(); } }, 'Jugar otra vez'),
        r.win ? null : h('button', { class: 'btn dark', onclick: closeModal }, 'Ver la casa'),
        h('button', { class: 'btn dark', onclick: showAchievements }, '🏆 Logros'))));
    paused = true;
  }

  /* ---------- El gato negro (gag del corto) ---------- */
  let catT = null;
  function scheduleCat() { clearTimeout(catT); catT = setTimeout(() => { spawnCat(); scheduleCat(); }, 40000 + Math.random() * 40000); }
  function spawnCat(dir) {
    if (!G.s || G.s.over || cineOpen || modalOpen || $('game').hidden || catEl) return;
    dir = dir || (Math.random() < 0.5 ? 'left' : 'right');
    const sc = $('scene');
    catEl = h('button', { class: 'cat ' + dir, 'aria-label': 'Gato negro', title: '¿Hacia dónde va?', onclick: () => {
      catEl.remove(); catEl = null; A.sfx('meow');
      if (dir === 'left') { UI.say('¡Un gato negro caminando hacia la IZQUIERDA! ¡Es fundamental! ¡Puto gato!'); achieve('gato'); }
      else UI.say('Un gato negro caminando... hacia la derecha, creo. Hasta ahí no llego. ¿Eso qué más da?');
    } }, '🐈‍⬛');
    sc.append(catEl); A.sfx('meow');
    setTimeout(() => { if (catEl) { catEl.remove(); catEl = null; } }, 7200);
  }

  /* ---------- Eventos y bucle ---------- */
  $('btnExamine').addEventListener('click', () => { if (G.s.sel) G.examine(G.s.sel); });
  $('btnDrop').addEventListener('click', () => { G.s.sel = null; render(); });
  $('btnMap').addEventListener('click', () => { sfx('click'); showMap(); });
  $('btnTarot').addEventListener('click', () => { if (G.s && !modalOpen && !cineOpen) { sfx('click'); playTarot(); } });
  $('btnHint').addEventListener('click', () => { if (G.s && !G.s.over && !modalOpen) { sfx('click'); G.nextHint(); render(); } });
  $('btnDots').addEventListener('click', () => { dots = !dots; LS.set('on13_dots', dots ? '1' : '0'); sfx('click'); render(); });
  function setAudioIcons() { $('btnSound').textContent = A.isSfx() ? '🔊' : '🔇'; }
  $('btnSound').addEventListener('click', () => { A.setSfx(!A.isSfx()); LS.set('on13_sfx', A.isSfx() ? '1' : '0'); setAudioIcons(); sfx('click'); });
  $('btnRules').addEventListener('click', () => { if (!modalOpen) showRules(); });
  $('btnMenu').addEventListener('click', () => {
    if (modalOpen || cineOpen) return;
    if (!G.s || G.s.over || $('game').hidden) return showTitle();
    openModal(h('h2', {}, '¿Salir al menú?'), h('p', {}, 'Tu partida se guarda automáticamente: podrás continuarla.'),
      h('div', { class: 'row' }, h('button', { class: 'btn dark', onclick: closeModal }, 'Seguir jugando'), h('button', { class: 'btn alt', onclick: () => { G.save(); showTitle(); } }, 'Salir al menú')));
  });
  $('timer').addEventListener('click', () => { if (!G.s || $('game').hidden) return; timerClicks++; if (timerClicks === 13) { achieve('triscai'); UI.say('¡Trece clics en el reloj! Pepe se desmaya del susto. Otra vez.'); } });
  document.addEventListener('pointerdown', () => A.unlock(), { once: true });
  document.addEventListener('keydown', (e) => {
    if (cineOpen) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); $('cine').click(); }
      else if (e.key === 'Escape') { e.preventDefault(); if (cineEnd) cineEnd(); }
      return;
    }
    if (e.key === 'Escape' && modalOpen && G.s && !G.s.over && !$('modalBox').querySelector('.title-screen')) closeModal();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.s && !G.s.over && !$('game').hidden) G.save(); });

  let last = performance.now(), acc = 0, lastBeep = 99;
  setInterval(() => {
    const now = performance.now(), dt = (now - last) / 1000; last = now;
    if (!G.s || paused || G.s.over || dt > 5) return;
    G.tick(dt); acc += dt;
    if (G.s.timeLeft < 15 && Math.floor(G.s.timeLeft) !== lastBeep) { lastBeep = Math.floor(G.s.timeLeft); sfx('tick'); }
    const t = $('timer'); t.textContent = fmt(G.s.timeLeft); const lw = lowTime(); t.classList.toggle('low', lw);
    if (acc > 5) { acc = 0; G.save(); }
  }, 250);

  // preferencias de audio guardadas
  A.setSfx(LS.get('on13_sfx') !== '0');
  setAudioIcons();
  V3.init();
  window.__escape = { G, X, UI, A, Meta, spawnCat, playTarot, playTrick, state: () => ({ paused, modalOpen, cineOpen }) };
  showTitle();
})();
