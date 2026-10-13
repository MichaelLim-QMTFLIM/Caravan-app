import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import {
  IonApp,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonRouterOutlet,
  IonToolbar,
} from '@ionic/angular';

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
    IonMenuButton,
    IonMenuToggle,
    IonRouterOutlet,
    IonToolbar,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  readonly showSplash = signal(true);
  readonly splashFading = signal(false);
  private splashTimer?: ReturnType<typeof setTimeout>;
  private splashHideTimer?: ReturnType<typeof setTimeout>;

  constructor(readonly auth: AuthService) {}

  readonly navigationItems: NavigationItem[] = [
    { label: 'Home', path: '/home', icon: 'home-outline' },
    { label: 'Market', path: '/store', icon: 'storefront-outline' },
    { label: 'Cart', path: '/cart', icon: 'cart-outline' },
    { label: 'Order history', path: '/orderhistory', icon: 'receipt-outline' },
    { label: 'FAQs', path: '/faqs', icon: 'help-circle-outline' },
    { label: 'About Caravan', path: '/about', icon: 'information-circle-outline' },
  ];

  ngOnInit(): void {
    // Startup must continue to login even when the API server is offline.
    this.splashTimer = setTimeout(() => {
      this.splashFading.set(true);
      this.splashHideTimer = setTimeout(() => this.showSplash.set(false), 300);
    }, 900);
    void this.auth.refresh();
  }

  ngOnDestroy(): void {
    clearTimeout(this.splashTimer);
    clearTimeout(this.splashHideTimer);
  }
}
