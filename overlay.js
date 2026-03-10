/**
 * =============================================================
 * overlay.js — Clothing Shape Overlay Renderer
 * =============================================================
 *
 * STATUS: Phase 2 — geometric shapes only (no real PNG yet)
 *
 * PURPOSE:
 *   Draws clothing shapes on the overlay canvas using body
 *   measurements from pose.js. Uses Canvas 2D API to render
 *   filled shapes that roughly match the user's body proportions.
 *
 *   This is the intermediate solution between emoji placeholders
 *   (Phase 1) and real AI cloth warping with PNG images (Phase 3).
 *
 * HOW TO ACTIVATE:
 *   In app.js onPoseResults callback, after getting measurements:
 *     overlayRenderer.opacity   = 0.82;
 *     overlayRenderer.sizeScale = state.fitScale;
 *     overlayRenderer.draw(measurements, state.selectedItem);
 *
 * CATEGORY → DRAW METHOD MAP:
 *   'tops'    → _drawTop()
 *   'jackets' → _drawJacket()
 *   'dresses' → _drawDress()
 *   'bottoms' → _drawBottom()
 *
 * FUTURE IMPROVEMENTS:
 *   - [ ] Replace all _draw methods with PNG warp from clothes.js
 *   - [ ] Add arm/sleeve rendering for jackets and shirts
 *   - [ ] Add clothing physics — slight sway when person moves
 *   - [ ] Add edge-softening blur on clothing boundary
 *   - [ ] Add shadow/depth layer beneath clothing for realism
 *   - [ ] Add colour filter overlay on top of real PNG for colour variants
 * =============================================================
 */


class OverlayRenderer {

  constructor(canvasEl) {
    this.canvas     = canvasEl;
    this.ctx        = canvasEl.getContext('2d');

    // Configurable properties — set from app.js
    this.opacity      = 0.82;   // 0–1 transparency of drawn clothing
    this.sizeScale    = 1.0;    // multiplied from state.fitScale
    this.posOffsetY   = 0;      // vertical nudge in pixels (positive = down)
    this.showSkeleton = false;  // debug mode: draw MediaPipe skeleton

    // Colour scheme — items with no colour defined fall back here
    this._fallbackColor = '#888888';
  }


  /* -----------------------------------------------------------
     DRAW
     Main entry point. Clears the canvas and draws the selected
     clothing item using body measurements.
     ----------------------------------------------------------- */

  draw(measurements, selectedItem) {
    const { ctx, canvas } = this;

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!measurements || !selectedItem) return;

    // Optionally draw skeleton for debugging body tracking
    if (this.showSkeleton) {
      this._drawSkeleton(measurements);
    }

    // Route to the right drawing method based on category
    const cat = selectedItem.category;
    const col = selectedItem.color ?? this._fallbackColor;

    if (cat === 'tops')    this._drawTop(measurements, col);
    if (cat === 'jackets') this._drawJacket(measurements, col);
    if (cat === 'dresses') this._drawDress(measurements, col);
    if (cat === 'bottoms') this._drawBottom(measurements, col);
  }


  /* -----------------------------------------------------------
     _DRAW TOP
     Renders a simple T-shirt trapezoid shape between shoulders and hips.
     FUTURE: replace with warped PNG from clothes.js
     ----------------------------------------------------------- */

  _drawTop(m, color) {
    const { ctx } = this;
    const scale   = this.sizeScale;
    const offsetY = this.posOffsetY;

    // Expand collar area by scale factor
    const shoulderExpand = (m.shoulderWidth * (scale - 1)) / 2;
    const hipExpand      = shoulderExpand * 1.1;

    const x1 = m.leftShoulder.x  - shoulderExpand;  // top-left
    const x2 = m.rightShoulder.x + shoulderExpand;  // top-right
    const x3 = m.rightHip.x      + hipExpand;       // bottom-right
    const x4 = m.leftHip.x       - hipExpand;       // bottom-left

    const y1 = m.leftShoulder.y  + offsetY;
    const y2 = m.rightShoulder.y + offsetY;
    const y3 = m.rightHip.y      + offsetY;
    const y4 = m.leftHip.y       + offsetY;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle   = color;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }


  /* -----------------------------------------------------------
     _DRAW JACKET
     Similar to top but wider, with lapel and button row details.
     FUTURE: replace with warped PNG from clothes.js
     ----------------------------------------------------------- */

  _drawJacket(m, color) {
    const { ctx } = this;
    const scale   = this.sizeScale * 1.1;   // jackets are slightly wider
    const offsetY = this.posOffsetY;

    const shoulderExpand = (m.shoulderWidth * (scale - 1)) / 2 + 10;
    const hipExpand      = shoulderExpand * 1.15;

    const x1 = m.leftShoulder.x  - shoulderExpand;
    const x2 = m.rightShoulder.x + shoulderExpand;
    const x3 = m.rightHip.x      + hipExpand;
    const x4 = m.leftHip.x       - hipExpand;

    const y1 = m.leftShoulder.y  + offsetY;
    const y2 = m.rightShoulder.y + offsetY;
    const y3 = m.rightHip.y      + offsetY;
    const y4 = m.leftHip.y       + offsetY;

    // Main jacket body
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle   = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();

    // Lapels — V-shape from collar down to mid-chest
    const midX     = (x1 + x2) / 2;
    const lapelY   = y1 + (y3 - y1) * 0.3;
    const lapelW   = m.shoulderWidth * 0.12;

    ctx.fillStyle = _darken(color, 0.15);
    // Left lapel
    ctx.beginPath();
    ctx.moveTo(midX, y1 + 10);
    ctx.lineTo(midX - lapelW, lapelY);
    ctx.lineTo(midX, lapelY - 5);
    ctx.closePath();
    ctx.fill();
    // Right lapel
    ctx.beginPath();
    ctx.moveTo(midX, y1 + 10);
    ctx.lineTo(midX + lapelW, lapelY);
    ctx.lineTo(midX, lapelY - 5);
    ctx.closePath();
    ctx.fill();

    // Button row — 3 dots along center line
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    const buttonCount = 3;
    const buttonStart = lapelY;
    const buttonEnd   = y3 - (y3 - y1) * 0.1;
    for (let i = 0; i < buttonCount; i++) {
      const by = buttonStart + ((buttonEnd - buttonStart) / (buttonCount - 1)) * i;
      ctx.beginPath();
      ctx.arc(midX, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }


  /* -----------------------------------------------------------
     _DRAW DRESS
     Full body shape from shoulders to below knees.
     FUTURE: replace with warped PNG from clothes.js
     ----------------------------------------------------------- */

  _drawDress(m, color) {
    const { ctx } = this;
    const scale   = this.sizeScale;
    const offsetY = this.posOffsetY;

    const shoulderExpand = (m.shoulderWidth * (scale - 1)) / 2;
    const hemExpand      = shoulderExpand + m.shoulderWidth * 0.35;  // flared hem

    const x1 = m.leftShoulder.x  - shoulderExpand;
    const x2 = m.rightShoulder.x + shoulderExpand;
    const y1 = m.leftShoulder.y  + offsetY;
    const y2 = m.rightShoulder.y + offsetY;

    // Hem is below knees
    const hemY = m.leftKnee.y + m.thighLength * 0.4 + offsetY;
    const midX = (x1 + x2) / 2;

    // Waist points — slightly narrower than shoulders
    const waistY  = m.hipMid.y + offsetY;
    const waistExpand = shoulderExpand * 0.7;
    const wx1 = m.leftHip.x  - waistExpand;
    const wx2 = m.rightHip.x + waistExpand;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle   = color;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    // Waist curves
    ctx.quadraticCurveTo(wx2 + 10, waistY, wx2 + hemExpand, hemY);   // right side
    ctx.lineTo(wx1 - hemExpand, hemY);                                 // hem bottom
    ctx.quadraticCurveTo(wx1 - 10, waistY, x1, y1);                  // left side
    ctx.closePath();
    ctx.fill();

    // Waist line detail
    ctx.strokeStyle = _darken(color, 0.1);
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(wx1 - waistExpand * 0.3, waistY);
    ctx.lineTo(wx2 + waistExpand * 0.3, waistY);
    ctx.stroke();

    ctx.restore();
  }


  /* -----------------------------------------------------------
     _DRAW BOTTOM
     Trousers / pants shape below the hips.
     FUTURE: replace with warped PNG from clothes.js
     ----------------------------------------------------------- */

  _drawBottom(m, color) {
    const { ctx } = this;
    const scale   = this.sizeScale;
    const offsetY = this.posOffsetY;

    const hipExpand   = (m.shoulderWidth * scale * 0.5);
    const ankleNarrow = hipExpand * 0.55;

    const x1 = m.leftHip.x   - hipExpand;
    const x2 = m.rightHip.x  + hipExpand;
    const y1 = m.leftHip.y   + offsetY;
    const y2 = m.rightHip.y  + offsetY;

    const ankleY = m.leftAnkle.y  + offsetY;
    const midX   = (x1 + x2) / 2;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle   = color;

    // Left leg
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(midX, y2);
    ctx.lineTo(midX - ankleNarrow * 0.3, ankleY);
    ctx.lineTo(x1 + (hipExpand - ankleNarrow), ankleY);
    ctx.closePath();
    ctx.fill();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(x2, y1);
    ctx.lineTo(midX, y2);
    ctx.lineTo(midX + ankleNarrow * 0.3, ankleY);
    ctx.lineTo(x2 - (hipExpand - ankleNarrow), ankleY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }


  /* -----------------------------------------------------------
     _DRAW SKELETON  (debug only)
     Draws MediaPipe landmark points and connecting lines.
     Toggle via overlayRenderer.showSkeleton = true
     ----------------------------------------------------------- */

  _drawSkeleton(m) {
    const { ctx } = this;
    const connections = [
      [m.leftShoulder,  m.rightShoulder],
      [m.leftShoulder,  m.leftHip],
      [m.rightShoulder, m.rightHip],
      [m.leftHip,       m.rightHip],
      [m.leftHip,       m.leftKnee],
      [m.rightHip,      m.rightKnee],
      [m.leftKnee,      m.leftAnkle],
      [m.rightKnee,     m.rightAnkle],
      [m.leftShoulder,  m.leftElbow],
      [m.rightShoulder, m.rightElbow],
      [m.leftElbow,     m.leftWrist],
      [m.rightElbow,    m.rightWrist],
    ];

    ctx.save();
    ctx.strokeStyle = 'rgba(255,200,0,0.7)';
    ctx.lineWidth   = 2;

    connections.forEach(([a, b]) => {
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    // Draw landmark dots
    ctx.fillStyle = 'rgba(255,80,80,0.9)';
    Object.values(m).forEach(pt => {
      if (pt && typeof pt.x === 'number') {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

}


/* -----------------------------------------------------------
   UTILITY: _darken
   Returns a slightly darkened version of a hex colour.
   Used for jacket lapels, dress waist lines, etc.
   @param hex    — '#rrggbb' string
   @param amount — 0–1 how much to darken (0.1 = 10%)
   ----------------------------------------------------------- */
function _darken(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r   = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * amount));
  const g   = Math.max(0, ((num >>  8) & 0xff) - Math.round(255 * amount));
  const b   = Math.max(0, ( num        & 0xff) - Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}


// Export singleton
// Usage in app.js:  overlayRenderer.draw(measurements, selectedItem);
const overlayRenderer = new OverlayRenderer(
  document.getElementById('overlay-canvas')
);
