/* ============================================================
   TANVEER NAIDU — interactions (vanilla)
   Multi-gallery, scoped lightbox, reveal, count-up, nav
   ============================================================ */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    preloader();
    navBehavior();
    revealOnScroll();
    revealTitles();
    countUp();
    initAllGalleries();
    scenePreview();
    lightbox();
    mobileMenu();
    customCursor();
    heroReactive();
    seamlessVideo();
    liquidText();
    autoScrollGalleries();
    mobileContactReactive();
  }

  /* ---- Hero: cursor/tilt parallax + warm light leak ---- */
  function heroReactive() {
    if (reduce) return;
    const hero  = document.getElementById('hero');
    const img   = hero ? hero.querySelector('.hero-img') : null;
    const lines = hero ? Array.from(hero.querySelectorAll('.hero-title .line > span')) : [];
    if (!hero || !img) return;

    /* Warm light-leak overlay — sits above scrim (z-index 1), below text (z-index 2) */
    const leak = document.createElement('div');
    leak.style.cssText = 'position:absolute;inset:0;z-index:1;pointer-events:none;opacity:0;transition:opacity 1.4s ease;mix-blend-mode:screen';
    hero.appendChild(leak);

    /* Image already fills container; scale up a touch so parallax has room */
    img.style.transformOrigin = 'center center';
    img.style.willChange = 'transform';

    let hx = 0.5, hy = 0.5;    /* target (normalized) */
    let cx = 0.5, cy = 0.5;    /* current (lerped)    */
    let leakOn = false;
    let tiltActive = false;

    const LERP       = 0.055;
    const IMG_SHIFT  = 38;          /* px max image shift  */
    const LINE_SHIFT = [8, 5, 2.5]; /* px per title line   */

    /* Main animation loop */
    (function tick() {
      cx += (hx - cx) * LERP;
      cy += (hy - cy) * LERP;
      const dx = cx - 0.5;   /* -0.5 → +0.5 */
      const dy = cy - 0.5;

      /* Image drifts opposite cursor — window/viewfinder effect */
      img.style.transform = `scale(1.09) translate(${(-dx * IMG_SHIFT).toFixed(2)}px,${(-dy * IMG_SHIFT * 0.55).toFixed(2)}px)`;

      /* Title lines at different depths */
      lines.forEach((ln, i) => {
        const s = LINE_SHIFT[i] ?? 1.5;
        ln.style.transform = `translate(${(dx * s).toFixed(2)}px,${(dy * s * 0.45).toFixed(2)}px)`;
      });

      /* Light leak: warm terracotta glow at cursor position */
      const lx = (cx * 100).toFixed(1);
      const ly = (cy * 100).toFixed(1);
      leak.style.background = `radial-gradient(ellipse 45% 55% at ${lx}% ${ly}%, oklch(0.96 0.006 80 / 0.05), transparent 65%)`;
      leak.style.opacity = leakOn ? '1' : '0';

      requestAnimationFrame(tick);
    })();

    /* ---- Desktop ---- */
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      hx = (e.clientX - r.left) / r.width;
      hy = (e.clientY - r.top)  / r.height;
      leakOn = true;
    });
    hero.addEventListener('mouseleave', () => { hx = 0.5; hy = 0.5; leakOn = false; });

    /* ---- Mobile: gyroscope (device orientation) ---- */
    function startTilt() {
      window.addEventListener('deviceorientation', (e) => {
        const r = hero.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const gamma = Math.max(-28, Math.min(28, e.gamma || 0));
        const beta  = Math.max(-18, Math.min(18, (e.beta  || 45) - 45));
        hx = (gamma / 56) + 0.5;
        hy = (beta  / 36) + 0.5;
        tiltActive = true;
        leakOn = true;
      });
    }

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        /* iOS 13+ requires user gesture to grant permission */
        hero.addEventListener('touchstart', () => {
          DeviceOrientationEvent.requestPermission()
            .then(s => { if (s === 'granted') startTilt(); })
            .catch(() => {});
        }, { once: true, passive: true });
      } else {
        startTilt();
      }
    }

    /* ---- Mobile fallback: touchmove across hero ---- */
    hero.addEventListener('touchmove', (e) => {
      if (tiltActive || !e.touches.length) return;
      const r = hero.getBoundingClientRect();
      hx = (e.touches[0].clientX - r.left) / r.width;
      hy = (e.touches[0].clientY - r.top)  / r.height;
      leakOn = true;
    }, { passive: true });
    hero.addEventListener('touchend', () => {
      if (tiltActive) return;
      hx = 0.5; hy = 0.5; leakOn = false;
    });
  }

  /* ---- Seamless video loop with true crossfade (dual-video dissolve) ---- */
  function seamlessVideo() {
    const vidA = document.getElementById('featureVid');
    if (!vidA) return;
    vidA.play().catch(() => {});

    /* Clone the video — both share the same src and CSS class positioning */
    const vidB = vidA.cloneNode(true);
    vidB.removeAttribute('id');
    vidB.removeAttribute('autoplay');
    vidB.muted = true;
    vidA.parentNode.appendChild(vidB);
    vidB.load();

    const TRANS       = 'opacity 0.9s ease';
    const FADE_BEFORE = 1.5;  /* seconds before end to begin dissolve */
    const FADE_MS     = 900;  /* crossfade duration in ms */

    vidA.style.transition = TRANS;
    vidA.style.opacity    = '1';
    vidA.style.zIndex     = '0';
    vidB.style.transition = TRANS;
    vidB.style.opacity    = '0';
    vidB.style.zIndex     = '1';

    let active = vidA, standby = vidB;

    function watchActive() {
      const cur = active, nxt = standby;

      function check() {
        if (!cur.duration) return;
        if (cur.duration - cur.currentTime > FADE_BEFORE) return;
        cur.removeEventListener('timeupdate', check);

        /* Bring next video in front and start it */
        nxt.style.zIndex  = '2';
        cur.style.zIndex  = '1';
        nxt.currentTime   = 0;
        nxt.play().catch(() => {});

        /* Dissolve: fade next in, fade current out simultaneously */
        requestAnimationFrame(() => {
          nxt.style.opacity = '1';
          cur.style.opacity = '0';
        });

        setTimeout(() => {
          cur.style.zIndex  = '0';
          nxt.style.zIndex  = '1';
          active  = nxt;
          standby = cur;
          watchActive();
        }, FADE_MS + 100);
      }

      cur.addEventListener('timeupdate', check);
    }

    watchActive();
  }

  /* ---- Preloader: count 00→100, then slide up & reveal hero ---- */
  function preloader() {
    const el = document.getElementById("preloader");
    if (!el) { heroIntro(); return; }
    const countEl = document.getElementById("preCount");
    const bar     = document.getElementById("preBar");
    document.body.classList.add("preload-active");

    const dur = reduce ? 400 : 1900;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 2);
      const val = Math.round(eased * 100);
      if (countEl) countEl.textContent = String(val).padStart(2, "0");
      if (bar) bar.style.width = val + "%";
      if (p < 1) requestAnimationFrame(tick);
      else finish();
    };
    requestAnimationFrame(tick);

    function finish() {
      setTimeout(() => {
        el.classList.add("hide");
        document.body.classList.remove("preload-active");
        heroIntro();
        setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1100);
      }, reduce ? 0 : 280);
    }
  }

  /* ---- Hero title intro ---- */
  function heroIntro() {
    const title = $(".hero-title");
    if (!title || reduce) return;
    title.classList.add("intro");
    requestAnimationFrame(() => {
      void title.offsetWidth;
      requestAnimationFrame(() => title.classList.remove("intro"));
    });
  }

  /* ---- Nav: solid bg + active link ---- */
  function navBehavior() {
    const nav = $("#nav");
    const hero = $("#hero");
    if (!nav) return;
    const onScroll = () => {
      const threshold = hero ? hero.offsetHeight - 90 : 400;
      nav.classList.toggle("solid", window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const links = $$(".nav-links a[data-nav]");
    const map = {};
    links.forEach((a) => {
      const id = a.getAttribute("href").slice(1);
      const sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            links.forEach((l) => l.classList.remove("active"));
            const a = map[e.target.id];
            if (a) a.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    Object.keys(map).forEach((id) => obs.observe(document.getElementById(id)));
  }

  /* ---- Reveal on scroll ---- */
  function revealOnScroll() {
    const els = $$("[data-reveal]");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
  }

  /* ---- Title clip-rise reveal (line-by-line, like hero) ---- */
  function revealTitles() {
    if (reduce || !("IntersectionObserver" in window)) return;

    const titles = $$(".sec-title");
    titles.forEach((title) => {
      /* Check if title has child HTML nodes (spans etc.) or is pure text */
      const hasHTML = title.querySelector("span, em, b, strong, a");

      if (!hasHTML) {
        /* Pure text — split words and stagger each */
        const words = title.textContent.trim().split(/\s+/);
        title.innerHTML = words
          .map((w, i) => {
            const delay = (i * 0.12).toFixed(2);
            return `<span class="tr-clip"><span class="tr-word" style="transition-delay:${delay}s">${w}</span></span>`;
          })
          .join(" ");
      } else {
        /* Mixed HTML — animate as single unit */
        const inner = title.innerHTML;
        title.innerHTML = `<span class="tr-clip tr-clip--block"><span class="tr-word">${inner}</span></span>`;
      }
      title.classList.add("tr-ready");
    });

    /* Also animate .contact-big, .foot-mark, scene names on scroll */
    $$(".contact-big, .foot-mark").forEach((el) => {
      if (el.querySelector(".tr-clip")) return;
      el.innerHTML = `<span class="tr-clip tr-clip--block"><span class="tr-word">${el.innerHTML}</span></span>`;
      el.classList.add("tr-ready");
    });

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("tr-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    $$(".tr-ready").forEach((el) => obs.observe(el));
  }

  /* ---- Count-up stats ---- */
  function countUp() {
    const nums = $$(".count");
    if (!nums.length) return;
    const fmt = (n) => (n >= 1000 ? n.toLocaleString("en-US") : String(n));
    const run = (el) => {
      const target = parseFloat(el.dataset.target) || 0;
      if (reduce) { el.textContent = fmt(target); return; }
      const dur = 1500, start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = fmt(target);
      };
      requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } }),
      { threshold: 0.6 }
    );
    nums.forEach((n) => obs.observe(n));
  }

  /* ---- Multi-gallery ---- */
  function initAllGalleries() {
    $$(".gallery").forEach(initGallery);
  }

  function initGallery(g) {
    const wrap = g.closest(".gallery-wrap");
    const frames = $$(".frame", g);
    if (!frames.length) return;

    const nowEl  = wrap ? $(".gnow",     wrap) : null;
    const barFill = wrap ? $(".gbar-fill", wrap) : null;
    let startX = 0, startScroll = 0, moved = 0, down = false;

    const update = () => {
      const max      = g.scrollWidth - g.clientWidth;
      const progress = max > 0 ? g.scrollLeft / max : 0;
      const center   = g.scrollLeft + g.clientWidth / 2;
      let idx = 0, best = Infinity;
      frames.forEach((f, i) => {
        const fc = f.offsetLeft + f.offsetWidth / 2;
        const d  = Math.abs(fc - center);
        if (d < best) { best = d; idx = i; }
      });
      if (nowEl)   nowEl.textContent = String(idx + 1).padStart(2, "0");
      if (barFill) {
        const bw = 100 / frames.length;
        barFill.style.width = bw + "%";
        barFill.style.left  = progress * (100 - bw) + "%";
      }
    };

    if (barFill) barFill.style.width = (100 / frames.length) + "%";
    update();
    g.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    g.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      down = true; moved = 0;
      startX = e.clientX; startScroll = g.scrollLeft;
      g.classList.add("dragging");
      if (g.setPointerCapture) g.setPointerCapture(e.pointerId);
    });
    g.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved += Math.abs(dx);
      g.scrollLeft = startScroll - dx;
    });
    const end = () => { down = false; g.classList.remove("dragging"); };
    g.addEventListener("pointerup",    end);
    g.addEventListener("pointercancel", end);
    g.addEventListener("pointerleave", () => { if (down) end(); });

    /* open lightbox scoped to THIS gallery's frames */
    frames.forEach((f, i) => {
      f.addEventListener("click", () => {
        if (moved > 6) return;
        window.__openLightbox && window.__openLightbox(i, frames);
      });
    });
  }

  /* ---- Scene index hover preview ---- */
  function scenePreview() {
    const wrap    = $("#scenePreview");
    const imgWrap = $(".sp-img",   wrap);
    const label   = $(".sp-label", wrap);
    const scenes  = $$(".scene[data-preview]");
    if (!wrap || !scenes.length) return;
    if (window.matchMedia("(max-width: 700px)").matches) return;

    let raf = null, tx = 0, ty = 0;
    let cycleTimer = null;
    let activeScene = null;

    /* Resolve image src via DOM (works for bundled blob-URLs too) */
    function resolveSrc(filename) {
      const domImg = document.querySelector('img[src="' + filename + '"]') ||
                     document.querySelector('img[src*="' + filename.replace(/\.[^.]+$/, '') + '"]');
      return domImg ? domImg.src : filename;
    }

    /* Swap the preview image with a crossfade */
    function showImg(filename, lbl) {
      if (!imgWrap) return;
      const src = resolveSrc(filename);
      const existing = imgWrap.querySelector('img');
      if (existing && existing.src === src) return;
      const img = document.createElement('img');
      img.src = src;
      img.alt = lbl || '';
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.45s ease';
      imgWrap.appendChild(img);
      /* Double rAF ensures the browser renders opacity:0 before transitioning
         to opacity:1 — a single rAF can batch both into one paint, killing the
         transition and leaving the image permanently invisible. */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          img.style.opacity = '1';
          if (existing) {
            existing.style.opacity = '0';
            setTimeout(() => { if (existing.parentNode) existing.parentNode.removeChild(existing); }, 480);
          }
        });
      });
      if (label) label.textContent = lbl || '';
    }

    /* Start auto-cycling through all images for a scene */
    function startCycle(s) {
      clearInterval(cycleTimer);
      const gallery = (s.dataset.previewGallery || s.dataset.preview).split('|');
      let idx = 0;
      showImg(gallery[idx], s.dataset.previewLabel);
      cycleTimer = setInterval(() => {
        idx = (idx + 1) % gallery.length;
        showImg(gallery[idx], s.dataset.previewLabel);
      }, 900);
    }

    /* Stop cycling (cursor is over the row) */
    function stopCycle() {
      clearInterval(cycleTimer);
      cycleTimer = null;
    }

    /* Preview dimensions (must match CSS .scene-preview width/height) */
    const PW = 260, PH = 340;

    const move = (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        /* Clamp so the preview (offset -50% left, -54% up by transform) never
           clips outside the viewport — especially important for South Africa
           which is the top-most scene and has the lowest cursor Y position. */
        const cx = Math.max(PW * 0.5 + 12, Math.min(window.innerWidth  - PW * 0.5 - 12, tx));
        const cy = Math.max(PH * 0.54 + 12, Math.min(window.innerHeight - PH * 0.46 - 12, ty));
        wrap.style.left = cx + 'px';
        wrap.style.top  = cy + 'px';
        raf = null;
      });
    };

    scenes.forEach((s) => {
      s.addEventListener('mouseenter', () => {
        activeScene = s;
        wrap.classList.add('show');
        window.addEventListener('mousemove', move);
        startCycle(s);
      });
      s.addEventListener('mouseleave', () => {
        activeScene = null;
        stopCycle();
        wrap.classList.remove('show');
        window.removeEventListener('mousemove', move);
        /* Clear imgs so next entry starts fresh */
        setTimeout(() => { if (!activeScene && imgWrap) imgWrap.innerHTML = ''; }, 500);
      });
    });
  }

  /* ---- Lightbox (scoped to the gallery that was clicked) ---- */
  function lightbox() {
    const lb = $("#lightbox");
    if (!lb) return;
    const imgWrap  = $(".lb-img",  lb);
    const noEl     = $("#lbNo"),   ttlEl   = $("#lbTtl");
    const focalEl  = $("#lbFocal"),apEl    = $("#lbAp");
    const shEl     = $("#lbSh"),   isoEl   = $("#lbIso"), locEl = $("#lbLoc");
    let current = 0, currentFrames = [];

    function parseExif(str) {
      const parts = (str || "").split("·").map((s) => s.trim());
      const out   = { focal: parts[0] || "—", ap: "—", sh: "—", iso: "—" };
      parts.forEach((p) => {
        if (/^f\//i.test(p))                         out.ap  = p;
        else if (/s$/.test(p) && p.indexOf("/") > -1) out.sh  = p;
        else if (/iso/i.test(p))                      out.iso = p.replace(/iso/i, "").trim();
      });
      return out;
    }

    function show(i) {
      if (!currentFrames.length) return;
      current = (i + currentFrames.length) % currentFrames.length;
      const f    = currentFrames[current];
      const slot    = $("image-slot", f);
      const realImg = $("img.frame-img", f);

      imgWrap.innerHTML = "";
      if (realImg) {
        /* real <img> — clone src + position into lightbox */
        const el = document.createElement("img");
        el.src   = realImg.src;
        el.alt   = realImg.alt || (f.dataset.title || "");
        el.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;object-position:" +
          (realImg.style.objectPosition || "center center");
        el.style.pointerEvents = "none";
        imgWrap.appendChild(el);
      } else if (slot) {
        /* image-slot (drag-drop placeholder) */
        const id = slot.getAttribute("id");
        const el = document.createElement("image-slot");
        el.setAttribute("id",          id);
        el.setAttribute("fit",         "cover");
        el.setAttribute("placeholder", f.dataset.title || "");
        el.style.pointerEvents = "none";
        imgWrap.appendChild(el);
      }

      const exif = parseExif(f.dataset.exif);
      noEl.textContent   = "/ " + (f.dataset.no || String(current + 1).padStart(2, "0"));
      ttlEl.textContent  = f.dataset.title  || "";
      focalEl.textContent = exif.focal;
      apEl.textContent    = exif.ap;
      shEl.textContent    = exif.sh;
      isoEl.textContent   = exif.iso;
      locEl.textContent   = f.dataset.loc   || "—";
    }

    function open(i, frames) {
      currentFrames = frames || $$(".frame");
      show(i);
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    window.__openLightbox = open;

    $("#lbClose", lb).addEventListener("click", close);
    $("#lbPrev",  lb).addEventListener("click", () => show(current - 1));
    $("#lbNext",  lb).addEventListener("click", () => show(current + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    window.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if      (e.key === "Escape")     close();
      else if (e.key === "ArrowLeft")  show(current - 1);
      else if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---- Mobile contact reactive: per-word flip on swipe/tap ---- */
  function mobileContactReactive() {
    /* Only activate on true touch devices */
    if (!window.matchMedia("(hover: none)").matches) return;
    const link = document.querySelector(".contact-big a");
    if (!link) return;
    const words = Array.from(link.querySelectorAll(".cb-word"));
    if (!words.length) return;

    function wordAt(x, y) {
      return words.find((w) => {
        const r = w.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      }) || null;
    }

    let lastWord = null;

    function activate(w) {
      if (w === lastWord) return;
      if (lastWord) lastWord.classList.remove("touch-active");
      lastWord = w;
      if (w) w.classList.add("touch-active");
    }

    link.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      activate(wordAt(t.clientX, t.clientY));
    }, { passive: true });

    link.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      activate(wordAt(t.clientX, t.clientY));
    }, { passive: true });

    link.addEventListener("touchend", () => {
      /* Small delay so the flip is visible before snapping back */
      const prev = lastWord;
      lastWord = null;
      if (prev) setTimeout(() => prev.classList.remove("touch-active"), 320);
    });
  }

  /* ---- Custom cursor: dot (exact) + ring (lagged) ---- */
  function customCursor() {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const dot  = document.createElement("div");
    const ring = document.createElement("div");
    dot.className  = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top  = my + "px";
    });

    /* expand ring on interactive elements */
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest("a, button, .frame, .scene")) ring.classList.add("hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest("a, button, .frame, .scene")) ring.classList.remove("hover");
    });

    /* Hide both cursor elements when pointer leaves the browser window */
    document.addEventListener('mouseleave', () => {
      dot.style.opacity  = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity  = '';
      ring.style.opacity = '';
    });

    const lerp = (a, b, t) => a + (b - a) * t;
    (function tick() {
      rx = lerp(rx, mx, 0.11);
      ry = lerp(ry, my, 0.11);
      ring.style.left = rx + "px";
      ring.style.top  = ry + "px";
      requestAnimationFrame(tick);
    })();
  }

  /* ---- Mobile menu ---- */
  function mobileMenu() {
    const btn = $("#menuBtn");
    const nav  = $("#nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("nav-open");
      btn.textContent = open ? "Close" : "Menu";
    });
    $$(".nav-links a", nav).forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("nav-open");
        btn.textContent = "Menu";
      })
    );
  }

  /* ---- Auto-scroll galleries (no clones, frame-level pause) ---- */
  function autoScrollGalleries() {
    if (reduce) return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    $$('.gallery').forEach((g) => {
      /* Remove any clones left from a previous version */
      $$('.auto-clone', g).forEach((c) => c.parentNode.removeChild(c));

      const frames = $$('.frame', g);
      if (frames.length < 2) return;

      /* No inline snap override needed — CSS snap removed so iOS can't block scrollLeft */

      let paused      = false;
      let rewinding   = false;
      let rewindTimer = null;
      const SPEED     = 0.65;

      /* ---- Pause helpers ---- */
      const pauseNow = () => { paused = true; clearTimeout(rewindTimer); };
      const resumeAfter = (ms) => setTimeout(() => { if (!rewinding) paused = false; }, ms);

      /* Mouse: pause on frame hover */
      if (!isTouch) {
        frames.forEach((f) => {
          f.addEventListener('mouseenter', pauseNow);
          f.addEventListener('mouseleave', () => { paused = false; });
        });
      }

      /* Touch: frame-level touchstart/touchend deliberately removed.
         iOS fires touchcancel (not touchend) during page-scroll, which left
         paused=true forever. pointerdown/pointercancel on g handles this cleanly. */

      /* Drag (pointer) — both desktop + mobile */
      g.addEventListener('pointerdown', () => {
        pauseNow();
        g.style.scrollSnapType = 'x mandatory';
      });
      g.addEventListener('pointerup', () => {
        g.style.scrollSnapType = 'none';
        resumeAfter(isTouch ? 2500 : 1600);
      });
      g.addEventListener('pointercancel', () => {
        /* iOS fires pointercancel instead of pointerup when it takes over the
           scroll gesture — without a resumeAfter here the gallery stays paused
           indefinitely on mobile. */
        g.style.scrollSnapType = 'none';
        resumeAfter(isTouch ? 2500 : 1600);
      });

      /* Smooth rewind to start after reaching the end */
      function smoothRewind(from, duration) {
        rewinding = true;
        const start = performance.now();
        function step(now) {
          if (paused) { rewinding = false; return; }
          const t    = Math.min((now - start) / duration, 1);
          const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
          g.scrollLeft = from * (1 - ease);
          if (t < 1) requestAnimationFrame(step);
          else { g.scrollLeft = 0; rewinding = false; }
        }
        requestAnimationFrame(step);
      }

      function tick() {
        if (!paused && !rewinding) {
          const max = g.scrollWidth - g.clientWidth;
          if (max > 0) {
            g.scrollLeft += SPEED;
            if (g.scrollLeft >= max - 2) {
              /* Pause at end for 2s, then smoothly rewind */
              paused = true;
              rewindTimer = setTimeout(() => {
                paused = false;
                smoothRewind(g.scrollLeft, 1800);
              }, 2000);
            }
          }
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---- Liquid text: magnetic word repulsion on cursor/touch proximity ---- */
  function liquidText() {
    const textEl = document.querySelector(".feature-quote .q");
    if (!textEl || reduce) return;
    /* Works on both desktop (mousemove) and mobile (touchmove) */

    /* Split by word — keeps natural wrapping intact */
    const raw = textEl.textContent.trim();
    const color = textEl.style.color || "var(--accent)";
    textEl.innerHTML = "";
    textEl.style.color = "";
    textEl.style.wordSpacing = "0.18em";

    const words = raw.split(/(\s+)/);
    const units = [];

    words.forEach((w) => {
      if (/^\s+$/.test(w)) {
        /* Preserve spaces as text nodes */
        textEl.appendChild(document.createTextNode(" "));
      } else {
        const span = document.createElement("span");
        span.textContent = w;
        span.style.cssText = `display:inline-block;white-space:nowrap;will-change:transform;color:${color};`;
        textEl.appendChild(span);
        units.push({ el: span, x: 0, y: 0, vx: 0, vy: 0 });
      }
    });

    const section = textEl.closest(".feature") || document.body;
    let mx = -9999, my = -9999, active = false;

    section.addEventListener("mousemove",  (e) => { mx = e.clientX; my = e.clientY; active = true; });
    section.addEventListener("mouseleave",  () => { active = false; mx = -9999; my = -9999; });
    /* Touch: finger position drives the same repulsion effect */
    section.addEventListener("touchmove", (e) => {
      if (e.touches.length) { mx = e.touches[0].clientX; my = e.touches[0].clientY; active = true; }
    }, { passive: true });
    section.addEventListener("touchend",  () => { active = false; mx = -9999; my = -9999; });

    const MAX_R   = 220;   /* influence radius px   */
    const PUSH    = 40;    /* max push distance px  */
    const SPRING  = 0.09;  /* stiffness             */
    const DAMPING = 0.74;  /* velocity damping      */

    function tick() {
      units.forEach((c) => {
        const r  = c.el.getBoundingClientRect();
        const cx = r.left + r.width  * 0.5;
        const cy = r.top  + r.height * 0.5;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        let tx = 0, ty = 0;
        if (active && dist < MAX_R) {
          const force = Math.pow(1 - dist / MAX_R, 2);
          tx = -(dx / dist) * force * PUSH;
          ty = -(dy / dist) * force * PUSH;
        }

        c.vx = c.vx * DAMPING + (tx - c.x) * SPRING;
        c.vy = c.vy * DAMPING + (ty - c.y) * SPRING;
        c.x += c.vx;
        c.y += c.vy;

        c.el.style.transform = `translate(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px)`;
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

})();


