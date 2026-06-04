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
    countUp();
    initAllGalleries();
    scenePreview();
    lightbox();
    mobileMenu();
    customCursor();
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
    const move = (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        wrap.style.left = tx + "px";
        wrap.style.top  = ty + "px";
        raf = null;
      });
    };

    scenes.forEach((s) => {
      s.addEventListener("mouseenter", () => {
        const filename = s.dataset.preview;
        const lbl = s.dataset.previewLabel || "";
        /* Resolve via DOM so bundled blob-URLs work too */
        const domImg = document.querySelector('img[src="' + filename + '"]') ||
                       document.querySelector('img[src*="' + filename.replace(/\.[^.]+$/, '') + '"]');
        const resolvedSrc = domImg ? domImg.src : filename;
        if (imgWrap) {
          imgWrap.innerHTML = "";
          const img = document.createElement("img");
          img.src = resolvedSrc;
          img.alt = lbl;
          imgWrap.appendChild(img);
        }
        if (label) label.textContent = lbl;
        wrap.classList.add("show");
        window.addEventListener("mousemove", move);
      });
      s.addEventListener("mouseleave", () => {
        wrap.classList.remove("show");
        window.removeEventListener("mousemove", move);
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
})();
