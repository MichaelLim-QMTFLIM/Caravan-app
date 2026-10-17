import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';
export type PesoStyle = '₱' | 'Php' | 'PHP' | 'PhP' | 'P';
export type MarketColumns = 2 | 3 | 4;

interface SavedSettings {
  theme?: AppTheme;
  pesoStyle?: PesoStyle;
  marketColumns?: number;
  reduceMotion?: boolean;
  disableBanners?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storageKey = 'caravan.settings.v1';
  readonly theme = signal<AppTheme>('light');
  readonly pesoStyle = signal<PesoStyle>('₱');
  readonly marketColumns = signal<MarketColumns>(3);
  readonly reduceMotion = signal(false);
  readonly disableBanners = signal(false);

  constructor() {
    this.restore();
    this.applyDocumentSettings();
  }

  setTheme(theme: AppTheme): void {
    this.theme.set(theme === 'dark' ? 'dark' : 'light');
    this.applyDocumentSettings();
    this.persist();
  }

  setPesoStyle(style: PesoStyle): void {
    const allowed: PesoStyle[] = ['₱', 'Php', 'PHP', 'PhP', 'P'];
    this.pesoStyle.set(allowed.includes(style) ? style : '₱');
    this.persist();
  }

  setMarketColumns(columns: number): void {
    this.marketColumns.set(([2, 3, 4].includes(Number(columns)) ? Number(columns) : 3) as MarketColumns);
    this.persist();
  }

  setReduceMotion(enabled: boolean): void {
    this.reduceMotion.set(!!enabled);
    this.applyDocumentSettings();
    this.persist();
  }

  setDisableBanners(disabled: boolean): void {
    this.disableBanners.set(!!disabled);
    this.persist();
  }

  formatCurrency(value: number): string {
    const amount = new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
    const style = this.pesoStyle();
    return style === '₱' ? `${style}${amount}` : `${style} ${amount}`;
  }

  private restore(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || '{}') as SavedSettings;
      if (saved.theme === 'dark' || saved.theme === 'light') this.theme.set(saved.theme);
      if (saved.pesoStyle) this.setPesoStyleWithoutSaving(saved.pesoStyle);
      if ([2, 3, 4].includes(Number(saved.marketColumns))) {
        this.marketColumns.set(Number(saved.marketColumns) as MarketColumns);
      }
      this.reduceMotion.set(!!saved.reduceMotion);
      this.disableBanners.set(!!saved.disableBanners);
    } catch {
      // Keep the defaults when saved settings are unavailable or malformed.
    }
  }

  private setPesoStyleWithoutSaving(style: string): void {
    if (['₱', 'Php', 'PHP', 'PhP', 'P'].includes(style)) this.pesoStyle.set(style as PesoStyle);
  }

  private applyDocumentSettings(): void {
    document.documentElement.classList.toggle('ion-palette-dark', this.theme() === 'dark');
    document.documentElement.classList.toggle('reduce-motion', this.reduceMotion());
  }

  private persist(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        theme: this.theme(),
        pesoStyle: this.pesoStyle(),
        marketColumns: this.marketColumns(),
        reduceMotion: this.reduceMotion(),
        disableBanners: this.disableBanners(),
      } satisfies SavedSettings));
    } catch {
      // Settings remain active for this session if browser storage is unavailable.
    }
  }
}
