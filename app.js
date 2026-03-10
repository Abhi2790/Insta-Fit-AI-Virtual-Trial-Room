/**
 * app.js — InstaFit Core Logic
 * ==============================
 * Depends on: catalog.js (must load first)
 *
 * Handles:
 *   - App state
 *   - Catalog rendering (gender, category, grid)
 *   - Camera toggle (on/off)
 *   - Focus mode (hide/show panels)
 *   - Clothing selection, size & fit
 *   - Snapshot download
 *   - Notification toasts
 *
 * FUTURE — Phase 2 (uncomment in index.html to activate):
 *   - pose.js    → body tracking via MediaPipe
 *   - overlay.js → canvas clothing shapes
 *   - clothes.js → real PNG image warp engine
 */


/* ── STATE ──────────────────────────────────────────────── */
const state = {
  gender:       'female',
  category:     'all',
  selectedItem: null,
  selectedSize: 'M',
  fitScale:     1.0,
  cameraOn:     false,
  stream:       null,
};


/* ── BOOT ───────────────────────────────────────────────── */
renderGrid();


/* ── GENDER ─────────────────────────────────────────────── */
function setGender(g) {
  state.gender = g;
  document.getElementById('btn-male').classList.toggle('active', g === 'male');
  document.getElementById('btn-female').classList.toggle('active', g === 'female');
  state.selectedItem = null;
  renderGrid();
}


/* ── CATEGORY ───────────────────────────────────────────── */
function setCategory(cat, el) {
  state.category = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderGrid();
}


/* ── RENDER GRID ────────────────────────────────────────── */
function renderGrid() {
  const grid  = document.getElementById('clothes-grid');
  const data  = CATALOG[state.gender];
  const items = state.category === 'all'
    ? Object.values(data).flat()
    : (data[state.category] || []);

  grid.innerHTML = items.map(item => `
    <div class="cloth-card ${state.selectedItem?.id === item.id ? 'selected' : ''}"
         onclick="selectItem('${item.id}')" id="card-${item.id}">
      <div class="selected-dot"></div>
      <div class="cloth-img-wrap" style="background:${item.color}22">
        <div class="cloth-emoji">${item.emoji}</div>
      </div>
      <div class="cloth-label">${item.name}</div>
    </div>
  `).join('');
}


/* ── SELECT ITEM ────────────────────────────────────────── */
function selectItem(id) {
  const all  = Object.values(CATALOG[state.gender]).flat();
  const item = all.find(i => i.id === id);
  if (!item) return;

  // Toggle: click same card to deselect
  state.selectedItem = (state.selectedItem?.id === id) ? null : item;
  renderGrid();

  if (state.selectedItem && state.cameraOn)  showNotif('👗 ' + item.name + ' selected');
  if (state.selectedItem && !state.cameraOn) showNotif('Tap 📷 to start camera');
}


/* ── SIZE ───────────────────────────────────────────────── */
function setSize(size, el) {
  state.selectedSize = size;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const scales = { S: .88, M: 1, L: 1.12, XL: 1.26 };
  state.fitScale = scales[size] || 1;
  showNotif('Size: ' + size);
}


/* ── FIT ADJUST ─────────────────────────────────────────── */
function adjustFit(dir) {
  state.fitScale = dir === 'looser'
    ? Math.min(1.4, state.fitScale + .05)
    : Math.max(.7,  state.fitScale - .05);
  showNotif('Fit: ' + (dir === 'looser' ? 'Looser' : 'Tighter'));
}


/* ── CAMERA TOGGLE ──────────────────────────────────────── */
async function toggleCamera() {
  if (state.cameraOn) {
    // Turn OFF
    if (state.stream) {
      state.stream.getTracks().forEach(t => t.stop());
      state.stream = null;
    }
    const v = document.getElementById('video');
    v.srcObject = null;
    v.classList.remove('active');
    document.getElementById('mirror-placeholder').classList.remove('hidden');
    setCamBtn(false);
    state.cameraOn = false;
    setFocus(false);
    showNotif('📷 Camera off');

  } else {
    // Turn ON
    document.getElementById('loading').classList.add('active');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 854 }, facingMode: 'user' }
      });
      state.stream = stream;

      const v = document.getElementById('video');
      v.srcObject = stream;
      v.onloadedmetadata = () => {
        v.classList.add('active');
        document.getElementById('mirror-placeholder').classList.add('hidden');
        document.getElementById('loading').classList.remove('active');

        // Size overlay canvas to match video
        const c = document.getElementById('overlay-canvas');
        c.width  = v.videoWidth;
        c.height = v.videoHeight;

        state.cameraOn = true;
        setCamBtn(true);
        setFocus(true);
        showNotif('📷 Camera on! Select a garment.');

        /* Phase 2 — uncomment to activate body tracking:
        poseTracker.start(v, (results) => {
          const m = poseTracker.getMeasurements(c.width, c.height);
          updateConfidence(poseTracker.getConfidence());
          if (state.selectedItem && m) overlayRenderer.draw(m, state.selectedItem);
        }); */
      };
    } catch(e) {
      document.getElementById('loading').classList.remove('active');
      showNotif('❌ Camera access denied');
    }
  }
}

/* Update camera button appearance */
function setCamBtn(on) {
  const btn = document.getElementById('mirror-cam-btn');
  if (!btn) return;
  btn.classList.toggle('on', on);
  document.getElementById('cam-icon').textContent  = on ? '🔴' : '📷';
  document.getElementById('cam-label').textContent = on ? 'Stop' : 'Camera';
}


/* ── FOCUS MODE ─────────────────────────────────────────── */
/* Hides side panels for a full-mirror view when camera is on */
function setFocus(on) {
  document.getElementById('main-layout').classList.toggle('focus-mode', on);
  document.getElementById('peek-left').classList.toggle('visible', on);
  document.getElementById('peek-right').classList.toggle('visible', on);
}

/* Called by peek tab buttons to restore panels */
function showPanel() {
  setFocus(false);
}


/* ── SNAPSHOT ───────────────────────────────────────────── */
function takeSnapshot() {
  if (!state.cameraOn) { showNotif('Start camera first!'); return; }

  const v    = document.getElementById('video');
  const ov   = document.getElementById('overlay-canvas');
  const snap = document.createElement('canvas');
  snap.width  = ov.width;
  snap.height = ov.height;

  const ctx = snap.getContext('2d');
  // Un-mirror the image so the saved photo looks natural
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(v,  -snap.width, 0, snap.width, snap.height);
  ctx.drawImage(ov, -snap.width, 0, snap.width, snap.height);
  ctx.restore();

  const a    = document.createElement('a');
  a.download = 'instafit-look.png';
  a.href     = snap.toDataURL();
  a.click();
  showNotif('📸 Snapshot saved!');
}


/* ── CLEAR SELECTION ────────────────────────────────────── */
function clearSelection() {
  state.selectedItem = null;
  renderGrid();
  const c = document.getElementById('overlay-canvas');
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
  showNotif('Cleared');
}


/* ── CONFIDENCE BAR ─────────────────────────────────────── */
/* Called by pose.js once body tracking is connected (Phase 2) */
function updateConfidence(val) {
  const pct = Math.round(val * 100);
  const bar = document.getElementById('confidence-bar');
  const lbl = document.getElementById('confidence-val');
  if (bar) {
    bar.style.width      = pct + '%';
    bar.style.background = pct > 70 ? '#a8d8ff' : pct > 40 ? '#c9943a' : '#c0392b';
  }
  if (lbl) lbl.textContent = pct + '%';
}


/* ── NOTIFICATION TOAST ─────────────────────────────────── */
let _notifTimer;
function showNotif(msg) {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_notifTimer);
  _notifTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
