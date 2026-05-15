/**
 * CulturalFacts.ts
 * Rotates short Georgian cultural and historical facts in the footer.
 *
 * Copy rules:
 * - Prefer careful wording over impressive but fragile claims.
 * - Use “often associated with” for interpretations, not settled proof.
 * - Avoid exact global rankings unless the source and definition are stable.
 */
export class CulturalFacts {
  private static readonly FACTS = [
    'Georgia is one of the world’s oldest wine-producing regions, with qvevri winemaking recognized by UNESCO.',
    'The Golden Fleece myth is often associated with Colchian gold-gathering traditions in mountain rivers.',
    'Georgian has three historic writing systems: Asomtavruli, Nuskhuri, and Mkhedruli.',
    'The living culture of Georgian writing is recognized by UNESCO as intangible cultural heritage.',
    'Mount Shkhara is the highest point in Georgia at about 5,193 meters.',
    'Vardzia is a 12th-century cave monastery complex connected with Georgia’s Golden Age.',
    'Dmanisi preserves some of the earliest hominin remains found outside Africa.',
    'Ushguli is widely known as one of Europe’s highest continuously inhabited settlements.',
  ];

  private _intervalId: number | null = null;
  private _el: HTMLElement | null = null;

  init(): void {
    this._el = document.getElementById('cf-text');
    this.start();
  }

  start(): void {
    if (this._intervalId !== null) return;
    this.rotate();
    this._intervalId = window.setInterval(() => this.rotate(), 15000);
  }

  stop(): void {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  rotate(): void {
    if (!this._el) return;
    const fact = CulturalFacts.FACTS[Math.floor(Math.random() * CulturalFacts.FACTS.length)];
    this._el.style.opacity = '0';
    setTimeout(() => {
      this._el!.textContent = fact;
      this._el!.style.opacity = '1';
    }, 500);
  }
}

export const culturalFacts = new CulturalFacts();
