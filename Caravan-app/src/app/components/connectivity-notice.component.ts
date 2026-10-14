import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

interface NetworkInformation extends EventTarget {
  effectiveType?: string;
  downlink?: number;
}

@Component({
  selector: 'app-connectivity-notice',
  standalone: true,
  template: `
    @if (visible) {
      <div class="connectivity-backdrop" role="presentation">
        <section class="connectivity-modal" role="alertdialog" aria-modal="true" aria-labelledby="connectivity-title">
          <div class="connectivity-icon" aria-hidden="true">!</div>
          <h2 id="connectivity-title">{{ isOffline ? 'You’re offline' : 'Connection is weak' }}</h2>
          <p>{{ isOffline ? 'Please connect to the internet to continue using Caravan.' : 'Your internet connection is slow. Some content may take longer to load.' }}</p>
          <button type="button" (click)="isOffline ? checkConnection() : continueAnyway()">{{ isOffline ? 'Try again' : 'Continue' }}</button>
        </section>
      </div>
    }
  `,
  styles: [`
    :host { position: relative; z-index: 11000; }
    .connectivity-backdrop { position: fixed; inset: 0; z-index: 11000; display: grid; place-items: center; padding: 20px; background: rgb(23 18 14 / 58%); backdrop-filter: blur(3px); }
    .connectivity-modal { width: min(100%, 390px); padding: 28px 24px 24px; border: 1px solid #d7c5b5; border-radius: 16px; background: #fffaf5; color: #34271f; text-align: center; box-shadow: 0 18px 48px rgb(0 0 0 / 25%); }
    .connectivity-icon { display: grid; width: 48px; height: 48px; margin: 0 auto 14px; place-items: center; border-radius: 50%; background: #f4e6d9; color: #6f4e37; font-size: 28px; font-weight: 700; }
    h2 { margin: 0 0 10px; font: 600 22px Georgia, serif; }
    p { margin: 0 0 22px; color: #62554b; line-height: 1.5; }
    button { min-height: 44px; padding: 10px 22px; border: 0; border-radius: 8px; background: #6f4e37; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
  `],
})
export class ConnectivityNoticeComponent implements OnInit, OnDestroy {
  visible = false;
  isOffline = false;
  private network?: NetworkInformation;
  private dismissedSlowConnection = false;

  ngOnInit(): void {
    this.network = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    this.network?.addEventListener('change', this.onNetworkChange);
    this.checkConnection();
  }

  ngOnDestroy(): void {
    this.network?.removeEventListener('change', this.onNetworkChange);
  }

  @HostListener('window:offline')
  onOffline(): void {
    this.isOffline = true;
    this.visible = true;
  }

  @HostListener('window:online')
  onOnline(): void { this.checkConnection(); }

  checkConnection(): void {
    this.isOffline = !navigator.onLine;
    const type = this.network?.effectiveType?.toLowerCase();
    const lowSpeed = typeof this.network?.downlink === 'number' && this.network.downlink < 0.5;
    const slowType = type === 'slow-2g' || type === '2g';
    this.visible = this.isOffline || ((lowSpeed || slowType) && !this.dismissedSlowConnection);
  }

  continueAnyway(): void {
    this.dismissedSlowConnection = true;
    this.visible = false;
  }

  private readonly onNetworkChange = (): void => {
    this.dismissedSlowConnection = false;
    this.checkConnection();
  };
}
