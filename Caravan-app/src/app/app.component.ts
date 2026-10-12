import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
export class AppComponent {
  readonly navigationItems: NavigationItem[] = [
    { label: 'Home', path: '/home', icon: 'home-outline' },
    { label: 'Market', path: '/store', icon: 'storefront-outline' },
    { label: 'Profile', path: '/profile', icon: 'person-outline' },
    { label: 'Cart', path: '/cart', icon: 'cart-outline' },
    { label: 'Order history', path: '/orderhistory', icon: 'receipt-outline' },
    { label: 'Reviews', path: '/review', icon: 'star-outline' },
    { label: 'FAQs', path: '/faqs', icon: 'help-circle-outline' },
    { label: 'About Caravan', path: '/about', icon: 'information-circle-outline' },
  ];
}
