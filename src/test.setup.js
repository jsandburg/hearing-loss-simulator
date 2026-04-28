// Vitest setup: polyfill localStorage for Node.js 25+ where the built-in
// stub lacks .clear() and conflicts with jsdom's implementation.
import { beforeEach } from 'vitest';

const store = {};
const mockLocalStorage = {
  getItem:    (k)    => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
  setItem:    (k, v) => { store[k] = String(v); },
  removeItem: (k)    => { delete store[k]; },
  clear:      ()     => { Object.keys(store).forEach(k => delete store[k]); },
  key:        (i)    => Object.keys(store)[i] ?? null,
  get length()       { return Object.keys(store).length; },
};
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, writable: true });

// Reset between every test so no state leaks across test files.
beforeEach(() => { localStorage.clear(); });
