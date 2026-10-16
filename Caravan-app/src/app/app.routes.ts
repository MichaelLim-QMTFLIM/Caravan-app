import { Routes } from '@angular/router';
import { CheckoutProcessingPage } from './pages/checkout-processing/checkout-processing.page';
import { OrderConfirmationPage } from './pages/order-confirmation/order-confirmation.page';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/aboutus/aboutus.page').then((m) => m.AboutPage),
  },
  {
    path: 'store',
    loadComponent: () => import('./pages/store/store.page').then( m => m.StorePage)
  },
  {
    path: 'product',
    loadComponent: () => import('./pages/product/product.page').then( m => m.ProductPage)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.page').then( m => m.CartPage)
  },
  {
    path: 'checkout/processing',
    component: CheckoutProcessingPage,
  },
  {
    path: 'checkout/confirmation/:orderId',
    component: OrderConfirmationPage,
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'faqs',
    loadComponent: () => import('./pages/faqs/faqs.page').then( m => m.FaqPage)
  },
  {
    path: 'orderhistory',
    loadComponent: () => import('./pages/orderhistory/orderhistory.page').then( m => m.OrderhistoryPage)
  },
  {
    path: 'review',
    loadComponent: () => import('./pages/review/review.page').then((m) => m.ReviewsPage),
  },
];
