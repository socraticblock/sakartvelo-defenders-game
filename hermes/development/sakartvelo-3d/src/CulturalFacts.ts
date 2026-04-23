/**
 * CulturalFacts.ts
 * Manages the rotating historical and cultural facts displayed in the footer.
 */
export class CulturalFacts {
  private static readonly FACTS = [
    "Georgia is one of the oldest wine-producing regions in the world.",
    "The Golden Fleece myth is linked to ancient Colchian gold-mining techniques.",
    "The Georgian alphabet is one of only 14 unique scripts in the world.",
    "Mount Shkhara is the highest point in Georgia at 5,193 meters.",
    "Vardzia is a massive cave monastery complex from the 12th century.",
    "The Bagrati Cathedral is a masterpiece of medieval Georgian architecture.",
    "The Dmanisi hominins are the oldest human remains found outside Africa.",
    "Ushguli is one of the highest continuously inhabited settlements in Europe."
  ];

  private _intervalId: number | null = null;
  private _el: HTMLElement | null = null;

  init(): void {
    this._el = document.getElementById('cf-text');
    this.start();
  }

  start(): void {
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
