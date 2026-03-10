/**
 * catalog.js — InstaFit Clothing Data
 * =====================================
 * Add new items here. Follow this shape:
 *   {
 *     id:       'unique-id',      e.g. 'f-t7'
 *     name:     'Display Name',
 *     emoji:    '👕',
 *     color:    '#hexcode',       swatch preview colour
 *     category: 'tops',           tops | jackets | dresses | bottoms
 *     image:    'clothes/top-f-t7.png'   optional — Phase 3
 *   }
 */

const CATALOG = {

  /* ── FEMALE ─────────────────────────────────────── */
  female: {
    tops: [
      { id: 'f-t1', name: 'Blue Tee',    emoji: '👕', color: '#a0b8d8', category: 'tops' },
      { id: 'f-t2', name: 'Cream Tee',   emoji: '👕', color: '#e8d8a0', category: 'tops' },
      { id: 'f-t3', name: 'Green Top',   emoji: '👚', color: '#7ab890', category: 'tops' },
      { id: 'f-t5', name: 'Cream Knit',  emoji: '🧶', color: '#e8d8b8', category: 'tops' },
      { id: 'f-t6', name: 'Black Tee',   emoji: '👕', color: '#2a2a2a', category: 'tops' },
    ],
    jackets: [
      { id: 'f-j1', name: 'Tan Blazer',  emoji: '🥼', color: '#c8a878', category: 'jackets' },
      { id: 'f-j3', name: 'Denim',       emoji: '🧥', color: '#5b7fa6', category: 'jackets' },
    ],
    dresses: [
      { id: 'f-d2', name: 'Pink Midi',   emoji: '👗', color: '#e8a0b8', category: 'dresses' },
      { id: 'f-d3', name: 'Blue Plaid',  emoji: '🩱', color: '#a0b8e8', category: 'dresses' },
    ],
    bottoms: [
      { id: 'f-b1', name: 'White Pants', emoji: '👖', color: '#f0ece0', category: 'bottoms' },
      { id: 'f-b2', name: 'Black Pants', emoji: '👖', color: '#1a1a1a', category: 'bottoms' },
    ],
  },

  /* ── MALE ───────────────────────────────────────── */
  male: {
    tops: [
      { id: 'm-t1', name: 'White Tee',   emoji: '👕', color: '#ffffff', category: 'tops' },
      { id: 'm-t2', name: 'Navy Shirt',  emoji: '👔', color: '#1e2a4a', category: 'tops' },
      { id: 'm-t3', name: 'Grey Tee',    emoji: '👕', color: '#888888', category: 'tops' },
      { id: 'm-t4', name: 'Black Tee',   emoji: '👕', color: '#1a1a1a', category: 'tops' },
    ],
    jackets: [
      { id: 'm-j1', name: 'Blazer',      emoji: '🥼', color: '#2c3e50', category: 'jackets' },
      { id: 'm-j2', name: 'Denim',       emoji: '🧥', color: '#4a6fa5', category: 'jackets' },
    ],
    dresses: [],
    bottoms: [
      { id: 'm-b1', name: 'Blue Jeans',  emoji: '👖', color: '#4a6fa5', category: 'bottoms' },
      { id: 'm-b2', name: 'Black Jeans', emoji: '👖', color: '#1a1a1a', category: 'bottoms' },
      { id: 'm-b3', name: 'Chinos',      emoji: '👖', color: '#c8a878', category: 'bottoms' },
    ],
  },

};
