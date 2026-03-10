/**
 * =============================================================
 * clothes.js — PNG Clothing Image Manager & Warp Engine
 * =============================================================
 *
 * STATUS: Phase 3 — image loading ready, warp engine stubbed
 *
 * MODULES IN THIS FILE:
 *   1. ClothingManager  — loads, caches and serves PNG images
 *   2. WarpEngine       — draws warped PNG onto overlay canvas
 *
 * IMAGE FILE NAMING CONVENTION:
 *   /clothes/{category}-{id}-{colorName}.png
 *   Examples:
 *     /clothes/top-f-t1-blue.png
 *     /clothes/jacket-m-j1-navy.png
 *     /clothes/dress-f-d2-pink.png
 *
 * HOW TO ADD REAL CLOTHING IMAGES:
 *   1. Export a transparent-background PNG (removebg.com recommended)
 *   2. Name it following the convention above
 *   3. Place it in the /clothes/ subfolder
 *   4. Add the 'image' key to the item in catalog.js
 *   5. Phase 3 will pick it up automatically via ClothingManager
 *
 * RECOMMENDED PNG SOURCES:
 *   - Remove backgrounds: https://www.remove.bg
 *   - Free fashion PNGs:  https://www.pngwing.com
 *   - Stock fashion:      https://www.freepik.com (with licence)
 *
 * FUTURE IMPROVEMENTS:
 *   - [ ] Implement real perspective warp using homography matrix
 *   - [ ] Add TPS (Thin Plate Spline) deformation for cloth physics
 *   - [ ] Integrate HR-VITON / OOTDiffusion backend for AI-quality warp
 *   - [ ] Add colour tinting on transparent PNGs for colour variants
 *   - [ ] Pre-load all images on app start (service worker / cache API)
 *   - [ ] Support animated GIF/APNG for moving garment previews
 * =============================================================
 */


/* =============================================================
   1. CLOTHING MANAGER
   Loads PNG images from /clothes/ folder with in-memory caching.
   Falls back to a colour-block placeholder if image is missing.
   ============================================================= */

class ClothingManager {

  constructor() {
    this._cache = new Map();   // key: image URL, value: HTMLImageElement
  }


  /* -----------------------------------------------------------
     PRELOAD ALL
     Preloads every image defined in CATALOG so there's no
     delay when the user selects a garment.
     Call this once at app start (after CATALOG is loaded).
     ----------------------------------------------------------- */

  async preloadAll() {
    const allItems = [
      ...Object.values(CATALOG.female).flat(),
      ...Object.values(CATALOG.male).flat(),
    ];

    const loads = allItems
      .filter(item => item.image)                   // only items with an image path
      .map(item => this._loadImage(item.image));    // start loading all in parallel

    await Promise.allSettled(loads);   // wait for all, don't fail if some are missing
    console.log(`[ClothingManager] Preloaded ${this._cache.size} images`);
  }


  /* -----------------------------------------------------------
     GET IMAGE
     Returns a cached HTMLImageElement for a given item ID.
     Falls back to a placeholder if no image is found.

     @param item         — catalog item object
     @param variantIndex — colour variant index (default 0)
     ----------------------------------------------------------- */

  getImage(item, variantIndex = 0) {
    if (!item.image) return this._makePlaceholder(item.color);

    const url = Array.isArray(item.image)
      ? (item.image[variantIndex] ?? item.image[0])
      : item.image;

    return this._cache.get(url) ?? this._makePlaceholder(item.color);
  }


  /* -----------------------------------------------------------
     _LOAD IMAGE  (private)
     Loads a single image into cache.
     Resolves even on error (so preloadAll doesn't crash).
     ----------------------------------------------------------- */

  _loadImage(url) {
    return new Promise((resolve) => {
      if (this._cache.has(url)) { resolve(this._cache.get(url)); return; }

      const img = new Image();
      img.onload  = () => { this._cache.set(url, img); resolve(img); };
      img.onerror = () => {
        console.warn(`[ClothingManager] Image not found: ${url}`);
        resolve(null);   // graceful fallback
      };
      img.src = url;
    });
  }


  /* -----------------------------------------------------------
     _MAKE PLACEHOLDER  (private)
     Creates a small canvas element filled with the item's colour.
     Used when a real PNG isn't available yet.
     ----------------------------------------------------------- */

  _makePlaceholder(color) {
    const canvas  = document.createElement('canvas');
    canvas.width  = 200;
    canvas.height = 300;
    const ctx     = canvas.getContext('2d');
    ctx.fillStyle = color ?? '#888888';
    ctx.fillRect(0, 0, 200, 300);
    return canvas;
  }

}


/* =============================================================
   2. WARP ENGINE
   Takes a clothing PNG image and stretches/positions it to
   match the user's body measurements on the overlay canvas.

   CURRENT IMPLEMENTATION: simple affine transform (scale + translate)
   FUTURE: true cloth warp using homography or TPS deformation
   ============================================================= */

class WarpEngine {

  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx    = canvasEl.getContext('2d');
  }


  /* -----------------------------------------------------------
     DRAW WARPED
     Main entry point. Draws the clothing image warped to body.

     @param imgEl        — HTMLImageElement (from ClothingManager)
     @param measurements — body measurements from pose.js
     @param item         — catalog item (for category routing)
     @param opts         — { opacity, sizeScale, posOffsetY }
     ----------------------------------------------------------- */

  drawWarped(imgEl, measurements, item, opts = {}) {
    const { ctx, canvas } = this;
    const opacity    = opts.opacity    ?? 0.9;
    const sizeScale  = opts.sizeScale  ?? 1.0;
    const posOffsetY = opts.posOffsetY ?? 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!imgEl || !measurements) return;

    const cat = item.category;

    if (cat === 'tops')    this._warpTop(imgEl, measurements, sizeScale, posOffsetY, opacity);
    if (cat === 'jackets') this._warpJacket(imgEl, measurements, sizeScale, posOffsetY, opacity);
    if (cat === 'dresses') this._warpDress(imgEl, measurements, sizeScale, posOffsetY, opacity);
    if (cat === 'bottoms') this._warpBottom(imgEl, measurements, sizeScale, posOffsetY, opacity);
  }


  /* -----------------------------------------------------------
     _WARP TOP  (private)
     Stretches top PNG to fit shoulder-width and torso-height.
     FUTURE: use homography for perspective correct warp
     ----------------------------------------------------------- */

  _warpTop(img, m, scale, offsetY, opacity) {
    const { ctx } = this;

    // Target bounding box on the user's torso
    const w  = m.shoulderWidth * scale * 1.4;
    const h  = m.torsoHeight   * scale * 1.15;
    const x  = m.shoulderMid.x - w / 2;
    const y  = m.shoulderMid.y + offsetY - h * 0.05;  // slight upward nudge for collar

    ctx.save();
    ctx.globalAlpha = opacity;

    // Clip to torso shape to avoid overflow
    this._clipTorso(m, scale, offsetY);

    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }


  /* -----------------------------------------------------------
     _WARP JACKET  (private)
     Wider than a top, includes collar area.
     ----------------------------------------------------------- */

  _warpJacket(img, m, scale, offsetY, opacity) {
    const { ctx } = this;

    const w = m.shoulderWidth * scale * 1.65;
    const h = m.torsoHeight   * scale * 1.2;
    const x = m.shoulderMid.x - w / 2;
    const y = m.shoulderMid.y + offsetY - h * 0.06;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }


  /* -----------------------------------------------------------
     _WARP DRESS  (private)
     Full length from shoulders to below knees.
     ----------------------------------------------------------- */

  _warpDress(img, m, scale, offsetY, opacity) {
    const { ctx } = this;

    const w  = m.shoulderWidth * scale * 1.5;
    const h  = (m.torsoHeight + m.legLength * 0.65) * scale;
    const x  = m.shoulderMid.x - w / 2;
    const y  = m.shoulderMid.y + offsetY;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }


  /* -----------------------------------------------------------
     _WARP BOTTOM  (private)
     Trousers from hips to ankles.
     ----------------------------------------------------------- */

  _warpBottom(img, m, scale, offsetY, opacity) {
    const { ctx } = this;

    const w  = m.shoulderWidth * scale * 1.1;
    const h  = m.legLength     * scale * 1.05;
    const x  = m.hipMid.x - w / 2;
    const y  = m.hipMid.y + offsetY;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }


  /* -----------------------------------------------------------
     _CLIP TORSO  (private)
     Sets a canvas clip path roughly matching the torso shape.
     Prevents clothing from rendering outside the body silhouette.
     FUTURE: use body segmentation mask from MediaPipe for exact clip
     ----------------------------------------------------------- */

  _clipTorso(m, scale, offsetY) {
    const { ctx } = this;
    const expand = m.shoulderWidth * scale * 0.15;

    ctx.beginPath();
    ctx.moveTo(m.leftShoulder.x  - expand, m.leftShoulder.y  + offsetY);
    ctx.lineTo(m.rightShoulder.x + expand, m.rightShoulder.y + offsetY);
    ctx.lineTo(m.rightHip.x      + expand, m.rightHip.y      + offsetY);
    ctx.lineTo(m.leftHip.x       - expand, m.leftHip.y       + offsetY);
    ctx.closePath();
    ctx.clip();
  }

}


// Export singletons for use in app.js
const clothingManager = new ClothingManager();
const warpEngine      = new WarpEngine(document.getElementById('overlay-canvas'));

/*
 * HOW TO USE IN app.js after Phase 3 images are ready:
 *
 *   // On app start:
 *   clothingManager.preloadAll();
 *
 *   // In onPoseResults callback:
 *   const img = clothingManager.getImage(state.selectedItem);
 *   warpEngine.drawWarped(img, measurements, state.selectedItem, {
 *     opacity:    0.9,
 *     sizeScale:  state.fitScale,
 *     posOffsetY: 0,
 *   });
 */
