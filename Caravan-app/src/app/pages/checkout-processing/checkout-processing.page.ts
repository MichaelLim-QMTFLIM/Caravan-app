import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';
import { PayPalNative } from '../../services/paypal-native.service';

interface CheckoutPayload {
  items: Array<{ productId: number; quantity: number; productSize: string }>;
  addressId: number;
  methodId: number | null;
  paymentType: 'cash' | 'paypal';
  shippingId: number;
  voucherId: number | null;
  totalCost: number;
}

declare global {
  interface Window { paypal?: any; }
}

@Component({
  selector: 'app-checkout-processing',
  standalone: true,
  imports: [CommonModule, IonContent, IonSpinner],
  templateUrl: './checkout-processing.page.html',
  styleUrls: ['./checkout-processing.page.scss'],
})
export class CheckoutProcessingPage implements OnInit, AfterViewInit {
  payload: CheckoutPayload | null = null;
  processing = true;
  error = '';
  message = 'Preparing your order…';
  private viewReady = false;
  private submittingOrder = false;

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  ngOnInit(): void {
    try {
      const stored = sessionStorage.getItem('pendingCheckout');
      this.payload = stored ? JSON.parse(stored) as CheckoutPayload : null;
    } catch {
      this.payload = null;
    }

    if (!this.payload?.items?.length) {
      void this.router.navigateByUrl('/cart');
      return;
    }
    if (this.payload.paymentType === 'cash') {
      this.message = 'Placing your cash on delivery order…';
      void this.submitOrder();
    } else if (this.viewReady) {
      void this.startPaypalCheckout();
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.payload?.paymentType === 'paypal') void this.startPaypalCheckout();
  }

  private async startPaypalCheckout(): Promise<void> {
    if (!this.payload || !this.viewReady || this.error) return;
    this.processing = true;
    this.message = 'Loading secure PayPal checkout…';
    try {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        await this.startAndroidPaypalCheckout();
        return;
      }

      await this.loadPaypalSdk();
      const paypal = window.paypal;
      if (!paypal) throw new Error('PayPal checkout is unavailable. Please try again.');

      await paypal.Buttons({
        fundingSource: paypal.FUNDING.PAYPAL,
        style: { layout: 'vertical', label: 'paypal' },
        createOrder: async () => {
          const result = await firstValueFrom(this.http.post<{ id: string }>('/paypal/create-order', {
            totalCost: this.payload?.totalCost,
            addressId: this.payload?.addressId,
          }));
          if (!result?.id) throw new Error('Unable to start PayPal payment.');
          return result.id;
        },
        onApprove: async (data: { orderID: string }) => {
          this.message = 'Confirming your PayPal payment…';
          this.processing = true;
          await this.submitOrder(data.orderID);
        },
        onCancel: () => {
          this.processing = false;
          this.message = 'Payment was cancelled. Your cart is still saved.';
        },
        onError: (error: unknown) => {
          console.error('PayPal checkout failed:', error);
          this.showError('PayPal could not complete your payment. Your cart is still saved.');
        },
      }).render('#paypal-button-container');

      this.processing = false;
      this.message = 'Approve your payment securely with PayPal.';
    } catch (error: any) {
      console.error('Unable to initialize PayPal:', error);
      this.showError(error?.error?.error || error?.message || 'Unable to load PayPal checkout.');
    }
  }

  private async startAndroidPaypalCheckout(): Promise<void> {
    if (!this.payload) return;
    const config = await firstValueFrom(this.http.get<{ clientId: string; merchantId: string; environment: 'sandbox' | 'live' }>('/paypal/config'));
    await PayPalNative.initialize({
      clientId: config.clientId,
      merchantId: config.merchantId,
      environment: config.environment || 'sandbox',
    });

    // PayPal recommends preparing its shopper session alongside server order creation.
    const [, order] = await Promise.all([
      PayPalNative.createPayPalSession({}),
      firstValueFrom(this.http.post<{ id: string }>('/paypal/create-order', {
        totalCost: this.payload.totalCost,
        addressId: this.payload.addressId,
      })),
    ]);
    if (!order?.id) throw new Error('Unable to start PayPal payment.');

    this.message = 'Approve your payment in PayPal…';
    const approval = await PayPalNative.startCheckout({ orderId: order.id });
    if (approval.status === 'cancelled') {
      this.processing = false;
      this.message = 'Payment was cancelled. Your cart is still saved.';
      return;
    }
    if (approval.status !== 'approved') {
      throw new Error(approval.message || 'PayPal could not approve this payment.');
    }

    await this.submitOrder(approval.orderId || order.id);
  }

  private async loadPaypalSdk(): Promise<void> {
    if (window.paypal) return;
    const config = await firstValueFrom(this.http.get<{ clientId: string }>('/paypal/config'));
    if (!config?.clientId) throw new Error('PayPal is not configured.');

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&currency=PHP&intent=capture`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load PayPal checkout.'));
      document.head.appendChild(script);
    });
  }

  private async submitOrder(paypalOrderId?: string): Promise<void> {
    if (!this.payload || this.submittingOrder) return;
    this.submittingOrder = true;
    this.processing = true;
    this.error = '';
    this.message = this.payload.paymentType === 'cash'
      ? 'Placing your cash on delivery order…'
      : 'Confirming your PayPal payment…';
    try {
      const result = await firstValueFrom(this.http.post<any>('/checkout', {
        ...this.payload,
        ...(paypalOrderId ? { paypalOrderId } : {}),
      }));
      if (!result?.orderId) throw new Error('The order was not confirmed by the server.');

      localStorage.removeItem('cart');
      sessionStorage.removeItem('pendingCheckout');
      sessionStorage.setItem('checkoutConfirmation', JSON.stringify({
        orderId: result.orderId,
        email: result.customerEmail || '',
        emailSent: !!result.emailSent,
        paymentType: this.payload.paymentType,
      }));
      await this.router.navigate(['/checkout/confirmation', result.orderId]);
    } catch (error: any) {
      console.error('Checkout failed:', error);
      this.showError(error?.error?.error || error?.message || 'Unable to place your order. Your cart is still saved.');
    } finally {
      this.submittingOrder = false;
    }
  }

  private showError(message: string): void {
    this.error = message;
    this.processing = false;
  }

  returnToCart(): void {
    void this.router.navigateByUrl('/cart');
  }
}
