(function () {
  "use strict";

  /* Every photograph on the site: src, title, scene, home section */
  const PHOTOS = [
    { src: "work-seagull.jpg",   t: "Flight",           c: "Selected Work", h: "work", m: "Egret skimming open water" },
    { src: "work-sunset.jpg",    t: "Last Light",       c: "Selected Work", h: "work", m: "A figure on the tidal rocks" },
    { src: "work-plane.jpg",     t: "Cruising Altitude",c: "Selected Work", h: "work", m: "A jet against the gradient" },
    { src: "work-excavator.jpg", t: "Red Earth",        c: "Selected Work", h: "work", m: "Excavator on iron-rich ground" },
    { src: "work-plant.jpg",     t: "Bloom",            c: "Selected Work", h: "work", m: "A single bud, the city beyond" },
    { src: "sa-tower.jpg",       t: "The Tower",        c: "South Africa",  h: "south-africa", m: "High-rise under construction" },
    { src: "sa-sandton.jpg",     t: "Sandton City",     c: "South Africa",  h: "south-africa", m: "The northern skyline" },
    { src: "sa-glass.jpg",       t: "Glass & Steel",    c: "South Africa",  h: "south-africa", m: "A mirror-clad office block" },
    { src: "sa-madiba.jpg",      t: "Madiba",           c: "South Africa",  h: "south-africa", m: "Mandela, cast mid-stride" },
    { src: "sa-fourways.jpg",    t: "Fourways",         c: "South Africa",  h: "south-africa", m: "Dusk at the intersection" },
    { src: "ind-minaret.jpg",    t: "Minaret",          c: "India",         h: "india", m: "A spire behind the stalls" },
    { src: "ind-charminar.jpg",  t: "Charminar",        c: "India",         h: "india", m: "Four minarets at midday" },
    { src: "ind-secretariat.jpg",t: "The Secretariat",  c: "India",         h: "india", m: "Domes in warm grain" },
    { src: "ind-bazaar.jpg",     t: "The Bazaar",       c: "India",         h: "india", m: "Signs over a crowded lane" },
    { src: "ind-pigeons.jpg",    t: "The Keeper",       c: "India",         h: "india", m: "Among the pigeons" },
    { src: "nat-mist.jpg",       t: "Mist",             c: "Nature",        h: "nature", m: "Cloud caught on the ridge" },
    { src: "nat-clouds.jpg",     t: "Above the Clouds", c: "Nature",        h: "nature", m: "A valley under low cloud" },
    { src: "nat-terraces.jpg",   t: "Terraces",         c: "Nature",        h: "nature", m: "A stepped green hillside" },
    { src: "nat-dragonfly.jpg",  t: "Dragonfly",        c: "Nature",        h: "nature", m: "Resting on a dry stem" },
    { src: "str-gridlock.jpg",   t: "Gridlock",         c: "Street",        h: "street", m: "Bumper to bumper" },
    { src: "str-market.jpg",     t: "The Market",       c: "Street",        h: "street", m: "Stalls spill to the street" },
    { src: "str-911.jpg",        t: "911",              c: "Street",        h: "street", m: "A Porsche at the kerb" },
    { src: "str-sunday.jpg",     t: "Sunday Drive",     c: "Street",        h: "street", m: "An autumn road, slow traffic" },
    { src: "str-corner.jpg",     t: "Corner",           c: "Street",        h: "street", m: "Life at the street corner" }
  ];

  const N = PHOTOS.length;
  const STEP = 360 / 8;             /* 8 frames per revolution → 3 turns,
                                       45° apart so frames never overlap */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const world  = document.getElementById("sgWorld");
  const meta   = document.getElementById("sgMeta");
  const elNo   = document.getElementById("sgNo");
  const elTitle= document.getElementById("sgTitle");
  const elCat  = document.getElementById("sgCat");
  const elNow  = document.getElementById("sgNow");
  const elTotal= document.getElementById("sgTotal");
  const hint   = document.getElementById("sgHint");
  const rail   = document.getElementById("sgRail");
  const spacer = document.getElementById("sgSpacer");
  const list   = document.getElementById("sgList");

  elTotal.textContent = String(N).padStart(2, "0");

  /* ---- Reduced-motion fallback: plain captioned list ---- */
  if (reduce) {
    PHOTOS.forEach((p, i) => {
      const f = document.createElement("figure");
      const img = document.createElement("img");
      img.src = p.src; img.alt = p.t; img.loading = "lazy";
      const cap = document.createElement("figcaption");
      cap.textContent = String(i + 1).padStart(2, "0") + " — " + p.t + " · " + p.c;
      f.appendChild(img); f.appendChild(cap);
      list.appendChild(f);
    });
    return;
  }

  /* ---- MOBILE: lightweight 2D scroll gallery -------------------------------
     The helix is a captured/virtual scroll that fights touch devices AND keeps
     every full-size image in a 3D layer — which crashes iOS Safari on memory.
     On phones we render a plain native scroll instead. The frame nearest the
     screen centre scales up; the rest scale down — pure 2D, driven by a single
     IntersectionObserver (no per-frame loop), and off-screen frames are dropped
     from rendering via content-visibility so their images don't stay decoded.
     Desktop is untouched (this branch returns before the helix code runs). ---- */
  if (window.matchMedia("(max-width: 700px)").matches) {
    buildMobileScroll();
    return;
  }

  function buildMobileScroll() {
    document.body.classList.add("sg-scroll");

    const SCENES = ["Selected Work", "South Africa", "India", "Nature", "Street"];

    const track = document.createElement("div");
    track.className = "mg-track";
    const items = [];
    PHOTOS.forEach((p, i) => {
      const card = document.createElement("a");
      card.className = "mg-card";
      card.href = "index.html#" + p.h;
      card.setAttribute("aria-label", p.t + " — " + p.c);
      card.innerHTML =
        '<img class="mg-photo" src="' + p.src + '" alt="' + p.t + '" decoding="async" ' +
          (i < 2 ? 'fetchpriority="high"' : 'loading="lazy"') + ">" +
        '<span class="mg-no">/ ' + String(i + 1).padStart(2, "0") + "</span>" +
        '<div class="mg-cap">' +
          '<span class="cat">' + p.c + "</span>" +
          '<h2 class="t">' + p.t + "</h2>" +
          '<span class="m">' + (p.m || "") + "</span>" +
        "</div>";
      track.appendChild(card);
      items.push(card);
    });
    document.body.appendChild(track);

    /* scene dots */
    const dotsWrap = document.createElement("div");
    dotsWrap.className = "mg-dots";
    SCENES.forEach(() => dotsWrap.appendChild(document.createElement("i")));
    document.body.appendChild(dotsWrap);
    const dots = Array.from(dotsWrap.children);

    /* first-run scroll cue */
    const cue = document.createElement("div");
    cue.className = "mg-cue"; cue.textContent = "Scroll";
    document.body.appendChild(cue);

    let curScene = -1, scrolled = false;

    /* A narrow band across the screen centre. Whichever card overlaps it is the
       "mid" card → scales up, captions bloom in. CSS transitions do the smooth
       grow/shrink, so there is NO JavaScript animation loop running. */
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) { en.target.classList.remove("is-mid"); return; }
        const i = items.indexOf(en.target);
        if (i < 0) return;
        en.target.classList.add("is-mid");
        elNow.textContent = String(i + 1).padStart(2, "0");
        const sc = SCENES.indexOf(PHOTOS[i].c);
        if (sc !== curScene) { curScene = sc; dots.forEach((d, k) => d.classList.toggle("on", k === sc)); }
      });
    }, { rootMargin: "-46% 0px -46% 0px", threshold: 0 });
    items.forEach((c) => io.observe(c));

    window.addEventListener("scroll", () => {
      if (!scrolled && (window.scrollY || window.pageYOffset || 0) > 30) {
        scrolled = true; cue.classList.add("gone");
      }
    }, { passive: true });
  }

  /* ---- Build the helix ---- */
  const cards = [];
  PHOTOS.forEach((p, i) => {
    const card = document.createElement("a");
    card.className = "sg-card";
    card.href = "index.html#" + p.h;
    card.setAttribute("aria-label", p.t + " — " + p.c);
    const im = document.createElement("img");
    im.src = p.src; im.alt = p.t;
    im.loading = i < 14 ? "eager" : "lazy";
    im.decoding = "async";
    card.appendChild(im);
    const no = document.createElement("span");
    no.className = "sg-card-no";
    no.textContent = "/ " + String(i + 1).padStart(2, "0");
    card.appendChild(no);
    card.addEventListener("mouseenter", () => { hoverIdx = i; });
    card.addEventListener("mouseleave", () => { if (hoverIdx === i) hoverIdx = -1; });
    world.appendChild(card);
    cards.push(card);
  });

  /* hover pop: eased per-card scale */
  let hoverIdx = -1;
  const pop = new Array(N).fill(0);

  /* ---- Geometry (recomputed on resize) ---- */
  let R = 0, ySpace = 0, perItem = 1, mobile = false;
  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    mobile = vw <= 700;
    if (mobile) {
      /* tighter radius so frames stay fully on-screen on a narrow phone */
      R = Math.max(Math.min(vw * 0.30, 220), 110);
      ySpace = Math.max(Math.min(vh * 0.095, 92), 54);
    } else {
      R = Math.max(Math.min(vw * 0.38, 600), 240);        /* spread across view */
      ySpace = Math.max(Math.min(vh * 0.115, 110), 64);   /* dense coil — full helix visible above & below */
    }
    perItem = vh * 0.55;               /* virtual px of input per frame */
  }
  layout();
  let forceDraw = true;   /* request one full draw pass (init / resize) */
  window.addEventListener("resize", () => { layout(); forceDraw = true; });

  /* ---- Infinite virtual scroll: wheel / touch / keys drive an unbounded
     position; the helix wraps modulo N (24 × 45° = 3 exact turns) so you can
     scroll forever in either direction. ---- */
  document.body.classList.add("sg-3d");
  spacer.style.display = "none";
  let f = 0, target = 0, cur = -1, moved = false;

  /* ---- Idle auto-drift: when the user isn't actively scrolling, the spiral
     turns on its own, very slowly. Any input resets the idle timer. ---- */
  const IDLE_MS    = 1400;     /* wait this long after last input before drifting */
  const AUTO_SPEED = 0.0014;   /* frames advanced per animation frame (~1 frame / 12s) */
  let lastInput = performance.now();
  const noteInput = () => { lastInput = performance.now(); };

  window.addEventListener("wheel", (e) => {
    target += e.deltaY / perItem;
    moved = true;
    noteInput();
  }, { passive: true });

  let touchY = null;
  window.addEventListener("touchstart", (e) => {
    if (e.touches.length) touchY = e.touches[0].clientY;
    noteInput();
  }, { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (touchY === null || !e.touches.length) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    target += (touchY - y) / (perItem * 0.45);   /* finger-tuned ratio */
    touchY = y;
    moved = true;
    noteInput();
  }, { passive: false });
  window.addEventListener("touchend", () => { touchY = null; noteInput(); });

  const wrap = (d) => d - N * Math.round(d / N);   /* shortest signed distance */

  /* ---- Cursor parallax: the whole spiral leans subtly toward the mouse ---- */
  let mx = 0, my = 0, pmx = 0, pmy = 0;     /* -0.5..0.5 target / eased */
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX / window.innerWidth  - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  /* ---- Scroll → spiral ---- */

  /* Per-element write caches — we only touch the DOM when a value actually
     changes. This is the core smoothness fix: when the spiral is settled the
     loop produces identical strings and performs ZERO style writes, so the
     browser does no recalc/paint. During motion, values are quantized so the
     (expensive) grayscale filter repaints in coarse steps, not every frame. */
  const cT = new Array(N).fill("");
  const cO = new Array(N).fill("");
  const cF = new Array(N).fill("");
  const cZ = new Array(N).fill(0);
  const cPE = new Array(N).fill("");
  const cFront = new Array(N).fill(false);
  const cHover = new Array(N).fill(false);
  let cWorld = "", cMeta = "";
  const q = (v, s) => Math.round(v / s) * s;   /* quantize to step s */

  function setMeta(i) {
    if (i === cur) return;
    cur = i;
    const p = PHOTOS[i];
    /* fade out, swap, fade back in */
    meta.classList.add("swap");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elNo.textContent = "( " + String(i + 1).padStart(2, "0") + " )";
        elTitle.textContent = p.t;
        elCat.textContent = p.c;
        meta.classList.remove("swap");
      });
    });
    elNow.textContent = String(i + 1).padStart(2, "0");
    /* highlight scene on the rail */
    const links = rail.querySelectorAll("a");
    links.forEach((a) => a.classList.toggle("on", a.dataset.cat === p.c));
  }

  function render(now) {
    requestAnimationFrame(render);

    /* idle → drift the spiral forward at a slow, constant crawl */
    if (now - lastInput > IDLE_MS) target += AUTO_SPEED;

    const vel = (target - f) * 0.085;              /* this frame's motion  */
    f += vel;
    if (Math.abs(target - f) < 0.0004) f = target;

    /* eased cursor parallax — snap to target once it's imperceptibly close so
       the loop can fully settle (otherwise it animates forever by a hair). */
    pmx += (mx - pmx) * 0.06;
    pmy += (my - pmy) * 0.06;
    if (Math.abs(mx - pmx) < 0.0005) pmx = mx;
    if (Math.abs(my - pmy) < 0.0005) pmy = my;

    /* hover pops ease toward 0/1; track whether any are still moving */
    let popActive = false;
    for (let i = 0; i < N; i++) {
      const tgt = hoverIdx === i ? 1 : 0;
      pop[i] += (tgt - pop[i]) * 0.16;
      if (Math.abs(tgt - pop[i]) < 0.002) pop[i] = tgt;
      else popActive = true;
    }

    /* Nothing moving? Skip the entire per-card pass — no compute, no DOM
       writes, no paint. This is what keeps it buttery when settled or idle. */
    const moving = (f !== target) || (pmx !== mx) || (pmy !== my) || popActive;
    if (!moving && !forceDraw) { hint.classList.toggle("gone", moved); return; }
    forceDraw = false;

    /* wrapped position 0..N — the infinite loop anchor */
    const fm = ((f % N) + N) % N;

    /* scroll-velocity distortion — the helix leans into the motion, relaxing
       flat when the scroll settles. */
    const v = Math.max(-1.6, Math.min(1.6, vel * 10));
    const lean = v * 2.2;
    const rot = pmx * 7;                           /* parallax swings the helix */

    const wt =
      "translate(-50%, -50%) rotateX(" + (-3 + pmy * -5 + lean).toFixed(2) + "deg) rotateY(" + rot.toFixed(3) + "deg)";
    if (wt !== cWorld) { world.style.transform = wt; cWorld = wt; }

    for (let i = 0; i < N; i++) {
      const d = wrap(i - fm);                       /* wrapped helix offset */
      const a = (d * STEP + rot) * Math.PI / 180;   /* effective angle      */
      const c = Math.cos(a);                        /* 1 = front, -1 = back */
      const y = d * ySpace;
      /* MOBILE ONLY: scale by depth so the centre frame is large and frames
         shrink as they enter/leave — kills the same-size overlap pile-up.
         PC keeps mScale = 1, so its geometry is byte-for-byte unchanged. */
      const frontness = (c + 1) / 2;               /* 0 = back, 1 = front */
      const mScale = mobile ? (0.42 + 0.58 * frontness) : 1;
      const ps = (1 + pop[i] * 0.12) * mScale;     /* up to 12% hover bump */
      const pz = pop[i] * 46;                       /* and 46px closer     */

      const t =
        "translateY(" + y.toFixed(1) + "px) rotateY(" + (d * STEP).toFixed(2) + "deg) translateZ(" + (R + pz).toFixed(1) + "px) scale(" + ps.toFixed(3) + ")";
      if (t !== cT[i]) { cards[i].style.transform = t; cT[i] = t; }

      /* depth: frames darken + drain to B&W as they recede, colour floods back
         near the front. Quantized so this (expensive) filter only repaints in
         coarse steps instead of on every single frame. */
      const vis = Math.max(0, c);
      const colour = Math.pow(vis, 1.6);
      const o = q(0.78 + 0.22 * vis, 0.02).toFixed(2);
      if (o !== cO[i]) { cards[i].style.opacity = o; cO[i] = o; }
      const fl = "brightness(" + q(0.58 + 0.48 * vis, 0.04).toFixed(2) + ") grayscale(" + q(1 - colour, 0.05).toFixed(2) + ")";
      if (fl !== cF[i]) { cards[i].style.filter = fl; cF[i] = fl; }

      const z = Math.round(100 + c * 100);
      if (z !== cZ[i]) { cards[i].style.zIndex = String(z); cZ[i] = z; }

      const front = Math.abs(d) < 0.5;
      if (front !== cFront[i]) { cards[i].classList.toggle("is-front", front); cFront[i] = front; }
      const hov = hoverIdx === i && c > 0.05;
      if (hov !== cHover[i]) { cards[i].classList.toggle("is-hover", hov); cHover[i] = hov; }
      const pe = c > 0.05 ? "auto" : "none";
      if (pe !== cPE[i]) { cards[i].style.pointerEvents = pe; cPE[i] = pe; }
    }

    /* the meta text drifts a touch opposite the cursor — subtle parallax */
    const mt = (pmx * -14).toFixed(1) + "px " + (pmy * -10).toFixed(1) + "px";
    if (mt !== cMeta) { meta.style.translate = mt; cMeta = mt; }

    setMeta(((Math.round(fm) % N) + N) % N);
    hint.classList.toggle("gone", moved);
  }
  requestAnimationFrame(render);

  /* ---- Scene rail jumps to a category's first photo (shortest way round) ---- */
  rail.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const i = PHOTOS.findIndex((p) => p.c === a.dataset.cat);
      if (i < 0) return;
      const tm = ((target % N) + N) % N;
      target += wrap(i - tm);
      moved = true;
      noteInput();
    });
  });

  /* ---- Keyboard: step one frame ---- */
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      target = Math.round(target) + 1;
      moved = true;
      noteInput();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      target = Math.round(target) - 1;
      moved = true;
      noteInput();
    }
  });
})();