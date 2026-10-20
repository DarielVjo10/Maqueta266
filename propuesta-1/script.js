const CLASSES = [
  {
    id: "pole", name: "Pole fitness", price: "[PRECIO]", capacity: 8, card: "cc-black", hex: "hx-pink",
    slots: [
      { day: "Lunes", time: "6:00 PM – 7:00 PM", left: 5 },
      { day: "Lunes", time: "7:30 PM – 8:30 PM", left: 2 },
      { day: "Miércoles", time: "6:00 PM – 7:00 PM", left: 0 },
      { day: "Miércoles", time: "7:30 PM – 8:30 PM", left: 6 },
    ],
  },
  {
    id: "aerea", name: "Danza aérea", price: "[PRECIO]", capacity: 6, card: "cc-red", hex: "hx-red",
    slots: [
      { day: "Martes", time: "6:00 PM – 7:00 PM", left: 3 },
      { day: "Martes", time: "7:30 PM – 8:30 PM", left: 1 },
      { day: "Jueves", time: "6:00 PM – 7:00 PM", left: 4 },
    ],
  },
  {
    id: "flex", name: "Flexibilidad", price: "[PRECIO]", capacity: 10, card: "cc-white", hex: "hx-pink",
    slots: [
      { day: "Viernes", time: "6:00 PM – 7:00 PM", left: 7 },
      { day: "Viernes", time: "7:30 PM – 8:30 PM", left: 2 },
      { day: "Sábado", time: "9:00 AM – 10:00 AM", left: 9 },
    ],
  },
  {
    id: "aro", name: "Aro aéreo", price: "[PRECIO]", capacity: 6, card: "cc-pink", hex: "hx-red",
    slots: [
      { day: "Sábado", time: "10:30 AM – 11:30 AM", left: 4 },
      { day: "Sábado", time: "12:00 PM – 1:00 PM", left: 0 },
    ],
  },
];

const DAY_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const byId = (id) => CLASSES.find((c) => c.id === id);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let selection = null;

function setTheme(dark) {
  document.body.classList.toggle("dark", dark);
  $("#themeToggle span").textContent = dark ? "Claro" : "Oscuro";
  $(".menu-theme button").textContent = dark ? "Modo claro" : "Modo oscuro";
}
try { setTheme(localStorage.getItem("s266-theme") === "dark"); } catch (e) {}
$$("[data-theme-toggle]").forEach((b) => b.addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark");
  setTheme(dark);
  try { localStorage.setItem("s266-theme", dark ? "dark" : "light"); } catch (e) {}
}));

const nav = $("#nav");
const navToggle = $("#navToggle");
function setMenu(open) {
  nav.classList.toggle("menu-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
}
navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("menu-open")));
$$("#navLinks a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("click", (e) => { if (!nav.contains(e.target)) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

const topbar = $("#topbar");
const onScroll = () => topbar.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const classGrid = $("#classGrid");
classGrid.innerHTML = CLASSES.map((c, n) => `
  <article class="class-card ${c.card}" data-href="#/horarios/${c.id}">
    <span class="num">0${n + 1}</span><span class="mini-hex ${c.hex}"></span>
    <div>
      <h3>${c.name}</h3>
      <dl class="cc-meta">
        <div><dt>Precio</dt><dd>${c.price}</dd></div>
        <div><dt>Cupos por clase</dt><dd>${c.capacity}</dd></div>
      </dl>
      <a href="#/horarios/${c.id}" class="btn cc-btn">Ver horarios ${ARROW}</a>
    </div>
  </article>`).join("");
classGrid.addEventListener("click", (e) => {
  const card = e.target.closest("[data-href]");
  if (card && !e.target.closest("a")) location.hash = card.dataset.href;
});

const filters = $("#scheduleFilters");
const scheduleList = $("#scheduleList");
let filter = "all";

filters.innerHTML = [{ id: "all", name: "Todas" }, ...CLASSES].map((c) =>
  `<button type="button" class="chip-btn" role="tab" data-filter="${c.id}">${c.name}</button>`).join("");

function cuposHTML(slot, capacity) {
  const pct = Math.round((slot.left / capacity) * 100);
  let flag = "";
  if (slot.left === 0) flag = '<span class="flag out">Agotado</span>';
  else if (slot.left <= 2) flag = '<span class="flag">Últimos cupos</span>';
  const label = slot.left === 1 ? "cupo disponible" : "cupos disponibles";
  return `<div class="cupos"><div class="cupos-top"><span><b>${slot.left}</b> de ${capacity} ${label}</span>${flag}</div><span class="bar"><i style="width:${pct}%"></i></span></div>`;
}

function toMinutes(t) {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

function renderSchedule() {
  $$(".chip-btn", filters).forEach((b) => {
    const on = b.dataset.filter === filter;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", String(on));
  });

  const c = byId(filter);
  $("#horariosSub").innerHTML = c
    ? `<b>${c.name}</b> · Precio <b>${c.price}</b> · ${c.capacity} cupos por clase. Elige el día y la hora que prefieras.`
    : "Elige la clase, el día y la hora que prefieras. Cada horario muestra cuántos cupos quedan.";

  const rows = [];
  CLASSES.forEach((k) => k.slots.forEach((s, i) => {
    if (filter === "all" || filter === k.id) rows.push({ k, s, i });
  }));
  rows.sort((a, b) => DAY_ORDER.indexOf(a.s.day) - DAY_ORDER.indexOf(b.s.day) || toMinutes(a.s.time) - toMinutes(b.s.time));

  scheduleList.innerHTML = rows.map(({ k, s, i }, n) => `
    <div class="row${s.left === 0 ? " full" : ""}" style="animation-delay:${Math.min(n, 10) * 40}ms">
      <div class="row-class"><span class="dot ${k.hex}"></span><strong>${k.name}</strong></div>
      <div class="row-when"><strong>${s.day}</strong><span>${s.time}</span></div>
      ${cuposHTML(s, k.capacity)}
      <span class="row-price">${k.price}</span>
      ${s.left === 0
        ? '<span class="btn btn-red btn-sm is-disabled" aria-disabled="true">Agotado</span>'
        : `<a href="#/reserva/${k.id}/${i}" class="btn btn-red btn-sm">Reservar</a>`}
    </div>`).join("");
}

filters.addEventListener("click", (e) => {
  const b = e.target.closest("[data-filter]");
  if (!b || b.dataset.filter === filter) return;
  filter = b.dataset.filter;
  const hash = filter === "all" ? "#/horarios" : `#/horarios/${filter}`;
  history.replaceState(null, "", hash);
  stack[stack.length - 1] = hash;
  renderSchedule();
  b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
});

const pick = $("#pick");
const steps = $$("#bookingSteps li");

function renderPick() {
  const c = byId(selection.cid);
  const s = c.slots[selection.i];
  $(".pick-hex", pick).className = `pick-hex ${c.hex}`;
  $("#pickClass").textContent = c.name;
  $("#pickWhen").textContent = `${s.day} · ${s.time}`;
  $("#pickPrice").textContent = c.price;
  setSteps(2);
}

function setSteps(current) {
  steps.forEach((li) => {
    const n = Number(li.dataset.step);
    li.classList.toggle("done", n < current);
    li.classList.toggle("on", n === current);
  });
}

const form = $("#bookingForm");
form.addEventListener("input", (e) => {
  e.target.classList.remove("invalid");
  e.target.closest(".check")?.classList.remove("invalid");
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const invalid = $$("input[required]", form).filter((el) => !el.checkValidity());
  invalid.forEach((el) => (el.type === "checkbox" ? el.closest(".check").classList.add("invalid") : el.classList.add("invalid")));
  if (invalid.length) {
    invalid[0].focus();
    showToast(invalid[0].type === "checkbox" ? "Debes aceptar los términos para continuar" : "Revisa los campos marcados");
    return;
  }
  setSteps(3);
  showToast("¡Listo! Te llevamos al pago seguro con CardNet…");
});

const views = { home: $("#viewHome"), horarios: $("#viewHorarios"), reserva: $("#viewReserva"), faq: $("#viewFaq") };
const stack = [];
const scrollMem = {};
let current = null;

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

function parse(hash) {
  if (hash === "#/faq") return { view: "faq" };
  const m = hash.match(/^#\/(horarios|reserva)(?:\/([\w-]+))?(?:\/(\d+))?/);
  if (!m) return { view: "home", anchor: decodeURIComponent(hash.slice(1)) };
  const c = byId(m[2]);
  if (m[1] === "horarios") return { view: "horarios", cid: c ? c.id : "all" };
  const i = Number(m[3]);
  if (!c || !c.slots[i] || c.slots[i].left === 0) return { view: "horarios", cid: c ? c.id : "all", fix: true };
  return { view: "reserva", cid: c.id, i };
}

function jumpTo(y) {
  const root = document.documentElement;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, y);
  root.style.scrollBehavior = "";
}

function show(name) {
  if (current === name) return false;
  Object.entries(views).forEach(([key, el]) => {
    el.hidden = key !== name;
    el.classList.remove("enter");
  });
  if (current !== null && !reduceMotion) {
    void views[name].offsetWidth;
    views[name].classList.add("enter");
  }
  current = name;
  fitHoneys();
  return true;
}

function setNavActive(href) {
  $$("#navLinks a, .nav-faq").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === href));
}

function route() {
  let hash = location.hash;
  const prev = stack[stack.length - 1];
  if (prev !== undefined) scrollMem[prev] = window.scrollY;

  let isBack = false;
  if (stack.length > 1 && stack[stack.length - 2] === hash) { stack.pop(); isBack = true; }
  else if (prev !== hash) stack.push(hash);

  const r = parse(hash);
  if (r.fix) {
    hash = r.cid === "all" ? "#/horarios" : `#/horarios/${r.cid}`;
    history.replaceState(null, "", hash);
    stack[stack.length - 1] = hash;
  }
  setMenu(false);

  if (r.view === "home") {
    document.title = "Studio 266";
    if (!show("home")) return;
    const target = r.anchor && document.getElementById(r.anchor);
    if (isBack && scrollMem[hash] != null) jumpTo(scrollMem[hash]);
    else if (target) jumpTo(target.getBoundingClientRect().top + window.scrollY);
    else jumpTo(0);
    setNavActive(null);
    homeShown.forEach((fn) => fn());
    return;
  }

  if (r.view === "faq") {
    document.title = "Preguntas frecuentes · Studio 266";
  } else if (r.view === "horarios") {
    filter = r.cid;
    renderSchedule();
    document.title = "Horarios y cupos · Studio 266";
  } else {
    selection = { cid: r.cid, i: r.i };
    renderPick();
    document.title = "Reserva · Studio 266";
  }
  show(r.view);
  setNavActive(r.view === "faq" ? "#/faq" : "#/horarios");
  jumpTo(isBack && scrollMem[hash] != null ? scrollMem[hash] : 0);
  if (!isBack) $("[data-view-title]", views[r.view]).focus({ preventScroll: true });
}

function goBack(kind, fallback) {
  const prev = stack[stack.length - 2];
  if (prev !== undefined && parse(prev).view === kind) { history.back(); return; }
  if (kind === "home") location.hash = fallback || "#clases";
  else location.hash = selection ? `#/horarios/${selection.cid}` : "#/horarios";
}
document.addEventListener("click", (e) => {
  const back = e.target.closest("[data-back]");
  if (back) goBack(back.dataset.back, back.dataset.fallback);
});

const homeShown = [];
window.addEventListener("hashchange", route);

const toast = $("#toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

(() => {
  const track = $("#eventsTrack");
  const prev = $("#evPrev");
  const next = $("#evNext");
  const cur = $("#evCur");
  const bar = $("#evBar");
  const cards = $$(".event-card", track);
  const pad = (n) => String(n).padStart(2, "0");
  let w = 0, visible = 1, lastIdx = -1;

  function measure() {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    w = cards[0].getBoundingClientRect().width + gap;
    visible = w ? Math.max(1, Math.min(cards.length, Math.round((track.clientWidth + gap) / w))) : 1;
  }
  function update() {
    if (!w) measure();
    if (!w || !track.clientWidth) return;
    const left = track.scrollLeft;
    const max = track.scrollWidth - track.clientWidth;
    prev.disabled = left <= 2;
    next.disabled = left >= max - 2;
    const idx = Math.min(cards.length, Math.round(left / w) + 1);
    if (idx !== lastIdx) { cur.textContent = pad(idx); lastIdx = idx; }
    const share = visible / cards.length;
    bar.style.transform = `scaleX(${share + (1 - share) * (max > 0 ? left / max : 1)})`;
  }

  function goTo(index) {
    if (!w) measure();
    const max = track.scrollWidth - track.clientWidth;
    track.scrollTo({ left: Math.max(0, Math.min(max, index * w)), behavior: reduceMotion ? "auto" : "smooth" });
  }
  function go(dir, btn) {
    goTo(Math.round(track.scrollLeft / w) + dir);
    btn.classList.remove("pulse");
    void btn.offsetWidth;
    btn.classList.add("pulse");
  }
  prev.addEventListener("click", () => go(-1, prev));
  next.addEventListener("click", () => go(1, next));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1, next); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1, prev); }
  });

  let ticking = false, lastLeft = track.scrollLeft, stopT = 0;
  track.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const left = track.scrollLeft;
        if (left !== lastLeft && !reduceMotion) {
          const dir = left > lastLeft ? "next" : "prev";
          track.dataset.dir = dir;
          if (!track.classList.contains(`moving-${dir}`)) {
            track.classList.remove("moving-next", "moving-prev");
            track.classList.add(`moving-${dir}`);
          }
        }
        lastLeft = left;
        update();
      });
    }
    clearTimeout(stopT);
    stopT = setTimeout(() => track.classList.remove("moving-next", "moving-prev"), 120);
  }, { passive: true });
  window.addEventListener("resize", () => { measure(); update(); });
  homeShown.push(() => { measure(); update(); });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const card = en.target;
        const inView = en.intersectionRatio > 0.85;
        if (inView && !card.classList.contains("in-view") && track.dataset.dir && !reduceMotion) {
          card.classList.remove("enter-next", "enter-prev");
          void card.offsetWidth;
          card.classList.add(`enter-${track.dataset.dir}`);
        }
        card.classList.toggle("in-view", inView);
      });
    }, { root: track, threshold: [0, 0.85, 1] });
    cards.forEach((card) => {
      io.observe(card);
      card.addEventListener("animationend", () => card.classList.remove("enter-next", "enter-prev"));
    });
    track.classList.add("ready");
  }

  let startX = 0, startLeft = 0, pressed = false, moved = false;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    startX = e.clientX; startLeft = track.scrollLeft; pressed = true; moved = false;
  });
  track.addEventListener("pointermove", (e) => {
    if (!pressed) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 6) {
      moved = true;
      track.setPointerCapture(e.pointerId);
      track.classList.add("dragging");
    }
    if (moved) track.scrollLeft = startLeft - dx;
  });
  const endDrag = (e) => {
    pressed = false;
    if (!track.classList.contains("dragging")) return;
    track.classList.remove("dragging");
    const dx = e.clientX - startX;
    const from = Math.round(startLeft / w);
    const target = Math.abs(dx) > w * 0.15 ? from + (dx < 0 ? 1 : -1) : Math.round(track.scrollLeft / w);
    goTo(target);
  };
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
  track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  measure();
  update();
})();

$$("#profesoras [data-prof]").forEach((el) => {
  const pair = () => $$(`#profesoras [data-prof="${el.dataset.prof}"]`);
  el.addEventListener("mouseenter", () => pair().forEach((x) => x.classList.add("is-hl")));
  el.addEventListener("mouseleave", () => pair().forEach((x) => x.classList.remove("is-hl")));
});

(() => {
  const roster = $(".team-roster");
  const pos = $(".dancer-pos", roster);
  const svg = $(".dancer", roster);
  const items = $$(".team-list li", roster);
  let cur = 0;
  function place(i, animate) {
    const li = items[i];
    if (!li || !li.offsetHeight) return;
    const y = li.offsetTop + li.offsetHeight / 2 - pos.offsetHeight / 2;
    pos.style.transform = `translateY(${y}px)`;
    items.forEach((x, k) => x.classList.toggle("is-current", k === i));
    if (animate && i !== cur && !reduceMotion) {
      svg.classList.remove("spin");
      void svg.getBoundingClientRect();
      svg.classList.add("spin");
    }
    cur = i;
  }
  items.forEach((li, i) => {
    li.addEventListener("mouseenter", () => place(i, true));
    li.addEventListener("click", () => place(i, true));
  });
  $$(".honey-team [data-prof]").forEach((hx) =>
    hx.addEventListener("mouseenter", () => place(Number(hx.dataset.prof) - 1, true)));
  window.addEventListener("resize", () => place(cur, false));
  homeShown.push(() => place(cur, false));
  if (document.fonts) document.fonts.ready.then(() => place(cur, false));
  place(0, false);
})();

(() => {
  const map = $("#map");
  const q = encodeURIComponent(map.dataset.query);
  $("iframe", map).src = `https://www.google.com/maps?q=${q}&z=16&output=embed`;
  $("#directionsLink").href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
})();

$$(".faq-list details").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    $$(".faq-list details").forEach((other) => { if (other !== item) other.open = false; });
  });
});

function fitHoneys() {
  $$("[data-fit]").forEach((h) => {
    if (getComputedStyle(h).display === "grid") { h.style.zoom = ""; return; }
    const parent = h.parentElement;
    const cs = getComputedStyle(parent);
    const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (avail <= 0) return;
    const k = Math.min(1, avail / Number(h.dataset.fit));
    h.style.zoom = k < 1 ? k.toFixed(3) : "";
  });
}
let fitRaf;
window.addEventListener("resize", () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fitHoneys); });

if ("IntersectionObserver" in window && !reduceMotion) {
  const targets = $$(".section-head, .feature, .class-card, .single-class, .arch-wrap, .studio-text, .team-text, .team-visual, .honey-gallery, .event-card, .faq-list, .map, .visit-wrap", views.home);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  targets.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((x) => targets.includes(x));
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 3) * 90}ms`;
    el.classList.add("reveal");
    io.observe(el);
  });
  document.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "opacity" || !e.target.classList?.contains("in")) return;
    e.target.classList.remove("reveal", "in");
    e.target.style.transitionDelay = "";
  });
}

(() => {
  const el = $(".stats [data-count='2017']");
  if (!el || reduceMotion || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    const from = 1990, to = 2017, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 1100);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.6 });
  io.observe(el);
})();

(() => {
  const links = $$("#navLinks a").filter((a) => !a.getAttribute("href").startsWith("#/"));
  const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    if (current !== "home") return;
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      setNavActive(`#${en.target.id}`);
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();

route();
fitHoneys();
