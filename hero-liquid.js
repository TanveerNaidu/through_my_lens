/* ============================================================
   HERO LIQUID INVERSION LENS  (+ figure glow)
   A single fluid, organic blob hugs the cursor. It is painted white
   on a canvas composited with mix-blend-mode: difference, so the photo
   AND the white text invert (photographic negative) inside the blob and
   are untouched outside. A second canvas screens the aligned photographer
   silhouette — clipped to the blob — so the person glows pure white inside
   the lens. The blob stretches along motion instead of blurring.
   ============================================================ */
(function () {
  "use strict";

  function init() {
    const hero   = document.getElementById("hero");
    if (!hero) return;
    const canvas = hero.querySelector(".hero-liquid");
    const glow   = hero.querySelector(".hero-glow");
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx  = canvas.getContext("2d");
    const gctx = glow ? glow.getContext("2d") : null;

    /* ---- Black text clone: masked to the blob, painted above the glow so the
       title letters stay black even over the glowing figure ---- */
    let inv = null;
    const maskCanvas = document.createElement("canvas");
    const mctx = maskCanvas.getContext("2d");
    if (!reduce) {
      const top = hero.querySelector(".hero-top");
      const bot = hero.querySelector(".hero-bottom");
      const idx = hero.querySelector(".hero-index");
      inv = document.createElement("div");
      inv.className = "hero-invert";
      inv.setAttribute("aria-hidden", "true");
      if (top) inv.appendChild(top.cloneNode(true));
      if (bot) {
        const b = bot.cloneNode(true);
        const c = b.querySelector(".hero-cta");
        if (c) c.remove();
        inv.appendChild(b);
      }
      if (idx) inv.appendChild(idx.cloneNode(true));
      inv.style.webkitMaskImage = inv.style.maskImage = "linear-gradient(#0000,#0000)";
      hero.appendChild(inv);
    }

    /* object-fit: cover with object-position 58% center (matches .hero-img) */
    const OBJ_X = 0.58, OBJ_Y = 0.5;

    let W = 0, H = 0, DPR = 1, ready = false, inView = true;
    let glowFig = null;          /* prebuilt figure + bloom, alpha = luminance */

    /* ---- Load the aligned silhouette for the glow ---- */
    const figImg = new Image();
    let figReady = false;
    figImg.onload  = () => { figReady = true; if (W) buildGlowFig(); };
    figImg.onerror = () => { figReady = false; };
    figImg.src = "hero-reveal-layer.png";

    function coverDraw(c, img, w, h) {
      if (!img || !img.naturalWidth) return;
      const ir = img.naturalWidth / img.naturalHeight, cr = w / h;
      let dw, dh;
      if (ir > cr) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
      c.drawImage(img, (w - dw) * OBJ_X, (h - dh) * OBJ_Y, dw, dh);
    }

    /* Build a white figure (alpha = luminance) + a soft bloom halo, once per size */
    function buildGlowFig() {
      if (!figReady || !W) { glowFig = null; return; }
      const fig = document.createElement("canvas");
      fig.width = W; fig.height = H;
      const fc = fig.getContext("2d");
      coverDraw(fc, figImg, W, H);
      const id = fc.getImageData(0, 0, W, H), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = d[i];                 /* grayscale: r == luminance */
        d[i] = d[i + 1] = d[i + 2] = 255;
        d[i + 3] = lum;                   /* white, alpha = brightness */
      }
      fc.putImageData(id, 0, 0);

      glowFig = document.createElement("canvas");
      glowFig.width = W; glowFig.height = H;
      const g = glowFig.getContext("2d");
      g.filter = "blur(" + Math.round(W * 0.012) + "px)";   /* soft halo */
      g.globalAlpha = 0.7;
      g.drawImage(fig, 0, 0);
      g.filter = "none";
      g.globalAlpha = 1;
      g.drawImage(fig, 0, 0);                                 /* crisp core */
    }

    function resize() {
      const r = hero.getBoundingClientRect();
      if (!r.width || !r.height) return;
      DPR = Math.min(window.devicePixelRatio || 1, 1.6);
      W = Math.round(r.width  * DPR);
      H = Math.round(r.height * DPR);
      canvas.width = W; canvas.height = H;
      canvas.style.width  = r.width  + "px";
      canvas.style.height = r.height + "px";
      if (glow) {
        glow.width = W; glow.height = H;
        glow.style.width  = r.width  + "px";
        glow.style.height = r.height + "px";
      }
      const mw = 440;
      maskCanvas.width  = mw;
      maskCanvas.height = Math.max(1, Math.round(mw * H / W));
      buildGlowFig();
      ready = true;
    }

    /* ---- Pointer / touch ---- */
    let px = -1e5, py = -1e5, cx = 0, cy = 0;
    let hasPointer = false, lastMove = -1e5, seeded = false;
    function setPointer(clientX, clientY) {
      const r = hero.getBoundingClientRect();
      px = (clientX - r.left) * DPR;
      py = (clientY - r.top)  * DPR;
      if (!seeded) { cx = px; cy = py; seeded = true; }
      hasPointer = true;
      lastMove = performance.now();
    }
    window.addEventListener("mousemove", (e) => setPointer(e.clientX, e.clientY), { passive: true });
    hero.addEventListener("touchmove", (e) => {
      if (e.touches.length) setPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    hero.addEventListener("touchstart", (e) => {
      if (e.touches.length) setPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    /* ---- Presence: the blob fades/shrinks away when the cursor leaves the hero ---- */
    let present = 0, presentTarget = 0, hidden = true;
    hero.addEventListener("mouseenter", () => { presentTarget = 1; });
    hero.addEventListener("mouseleave", () => { presentTarget = 0; });
    hero.addEventListener("touchstart", () => { presentTarget = 1; }, { passive: true });
    hero.addEventListener("touchend",   () => { setTimeout(() => { presentTarget = 0; }, 1400); });

    /* ---- A solid stamp: full-strength core (=> fuller, more contrasted
       inversion), quick crisp falloff at the edge ---- */
    function stamp(c, x, y, r, a) {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0,    "rgba(255,255,255," + a + ")");
      g.addColorStop(0.84, "rgba(255,255,255," + a + ")");
      g.addColorStop(0.95, "rgba(255,255,255," + (a * 0.5) + ")");
      g.addColorStop(1,    "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }

    /* ---- One fluid blob: core + many independent lobes (each its own
       phase/frequency) so it ripples as a single living mass. ---- */
    const rnd = (a, b) => a + Math.random() * (b - a);
    const LOBES = 10;
    const lp = [], lfa = [], lfd = [], lfr = [];
    for (let i = 0; i < LOBES; i++) {
      lp.push(rnd(0, Math.PI * 2));
      lfa.push(rnd(0.0005, 0.0019));
      lfd.push(rnd(0.0006, 0.0021));
      lfr.push(rnd(0.0008, 0.0024));
    }
    function fluidBlob(c, r, now) {
      stamp(c, 0, 0, r * 0.96, 1);
      for (let i = 0; i < LOBES; i++) {
        const ang  = (i / LOBES) * Math.PI * 2 + Math.sin(now * lfa[i] + lp[i]) * 0.5;
        const dist = r * (0.44 + 0.28 * Math.sin(now * lfd[i] + lp[i]));
        const rr   = r * (0.42 + 0.24 * Math.sin(now * lfr[i] + lp[i] * 1.5));
        stamp(c, Math.cos(ang) * dist, Math.sin(ang) * dist, Math.max(rr, r * 0.2), 1);
      }
    }

    /* ---- Main loop ---- */
    let raf = 0, prevX = 0, prevY = 0, velAngle = 0, stretchAmt = 0, maskTick = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!ready || !inView) return;

      /* ease presence; when fully gone, clear everything and bail */
      present += (presentTarget - present) * 0.12;
      if (present < 0.012) {
        if (!hidden) {
          ctx.clearRect(0, 0, W, H);
          if (gctx) gctx.clearRect(0, 0, W, H);
          if (inv) inv.style.webkitMaskImage = inv.style.maskImage = "linear-gradient(#0000,#0000)";
          hidden = true;
        }
        prevX = cx; prevY = cy;
        return;
      }
      hidden = false;

      const idle = !hasPointer || (now - lastMove > 900);
      let tx = px, ty = py;
      if (!seeded) { tx = W * 0.5; ty = H * 0.52; cx = tx; cy = ty; seeded = true; }
      else if (idle) {
        tx = px + Math.sin(now * 0.0016) * W * 0.012;
        ty = py + Math.cos(now * 0.0014) * H * 0.012;
      }

      cx += (tx - cx) * 0.30;
      cy += (ty - cy) * 0.30;

      const dxv = cx - prevX, dyv = cy - prevY;
      const sp  = Math.hypot(dxv, dyv);
      const R   = Math.min(W, H) * 0.135 * present;   /* smaller blob, scaled by presence */
      const sx = 1, sy = 1;   /* no acceleration stretch — steady round mass */

      /* inversion lens */
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(velAngle); ctx.scale(sx, sy);
      fluidBlob(ctx, R, now);
      ctx.restore();

      /* figure glow: blob-shaped clip ∩ silhouette, screened on top */
      if (gctx) {
        gctx.clearRect(0, 0, W, H);
        if (glowFig) {
          gctx.save();
          gctx.translate(cx, cy); gctx.rotate(velAngle); gctx.scale(sx, sy);
          fluidBlob(gctx, R, now);
          gctx.restore();
          gctx.globalCompositeOperation = "source-in";
          gctx.drawImage(glowFig, 0, 0);
          gctx.globalCompositeOperation = "source-over";
        }
      }

      /* black text clone mask = the blob shape (throttled) */
      if (inv && (maskTick++ & 1) === 0) {
        mctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        mctx.drawImage(canvas, 0, 0, maskCanvas.width, maskCanvas.height);
        const url = maskCanvas.toDataURL();
        inv.style.webkitMaskImage = "url(" + url + ")";
        inv.style.maskImage = "url(" + url + ")";
      }

      prevX = cx; prevY = cy;
    }

    function start() {
      if (reduce) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { inView = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }

    let rt = 0;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { resize(); prevX = cx; prevY = cy; }, 160);
    });

    resize();
    start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
