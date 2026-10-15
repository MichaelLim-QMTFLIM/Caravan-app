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

  get isAndroidApp(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

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
    if (!this.isAndroidApp) {
      this.showError('PayPal checkout is available in the installed Caravan Android app. Open the app to approve payment; cash on delivery is available in this browser.');
      return;
    }
    this.processing = true;
    this.message = 'Preparing secure PayPal checkout…';
    try {
      await this.startAndroidPaypalCheckout();
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
    const profile = await firstValueFrom(this.http.get<{ email?: string }>('/api/profile')).catch(() => null);
    const [, order] = await Promise.all([
      PayPalNative.createPayPalSession({ email: profile?.email }),
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


  private async submitOrder(paypalOrderId?: string): Promise<boolean> {
    if (!this.payload || this.submittingOrder) return false;
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
      return false;
    } catch (error: any) {
      console.error('Checkout failed:', error);
      const checkoutError = String(error?.error?.error || error?.error?.issue || '');
      if (checkoutError.includes('INSTRUMENT_DECLINED')) {
        this.showError('PayPal declined this payment method. Choose another payment method in PayPal to try again.');
        return true;
      }
      this.showError(error?.error?.error || error?.message || 'Unable to place your order. Your cart is still saved.');
      return false;
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
