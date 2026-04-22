/**
 * historical_facts.ts
 * Historical facts for Sakartvelo Defenders.
 *
 * Data is loaded lazily from /data/historical_facts.json on first access,
 * keeping ~61 KB of text out of the main game bundle.
 */

export interface HistoricalFact {
  era: number;
  level: number;
  text: string;
  attribution: string;
}

let _facts: HistoricalFact[] = [];
let _loaded = false;
let _promise: Promise<void> | null = null;

/** Begin loading facts from JSON. Safe to call multiple times — only fetches once. */
export function loadFacts(): Promise<void> {
  if (_loaded) return Promise.resolve();
  if (_promise) return _promise;
  _promise = fetch('./data/historical_facts.json')
    .then(r => r.json())
    .then((data: HistoricalFact[]) => {
      _facts = data;
      _loaded = true;
    })
    .catch(err => {
      console.warn('[HistoricalFacts] failed to load, using empty list:', err);
      _facts = [];
      _loaded = true;
    });
  return _promise;
}

/** Synchronous lookup — returns null if facts not yet loaded */
export function getHistoricalFact(era: number, level: number): HistoricalFact | null {
  if (!_loaded) return null;
  return _facts.find(f => f.era === era && f.level === level) ?? null;
}
