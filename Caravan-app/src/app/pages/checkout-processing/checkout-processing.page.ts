import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
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
export class CheckoutProcessingPage implements OnInit, AfterViewInit, OnDestroy {
  payload: CheckoutPayload | null = null;
  processing = true;
  error = '';
  message = 'Preparing your order…';
  private viewReady = false;
  private submittingOrder = false;
  private paypalOrderId = '';
  private paypalReturnListener?: PluginListenerHandle;
  private appStateListener?: PluginListenerHandle;
  private paypalBrowserLaunched = false;
  private paypalReturnHandled = false;

  get isAndroidApp(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

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

  ngOnDestroy(): void {
    void this.paypalReturnListener?.remove();
    void this.appStateListener?.remove();
  }

  private async startPaypalCheckout(): Promise<void> {
    if (!this.payload || !this.viewReady || this.error) return;
    if (!this.isAndroidApp) {
      this.showError('PayPal checkout is available in the installed Caravan Android app. Open the app to approve payment; cash on delivery is available in this browser.');
      return;
    }
    this.processing = true;
    this.message = 'Preparing secure PayPal checkout…';
    this.refreshView();
    try {
      await this.startAndroidPaypalCheckout();
    } catch (error: any) {
      console.error('Unable to initialize PayPal:', error);
      this.showError(error?.error?.error || error?.message || 'Unable to load PayPal checkout.');
    }
  }

  private async startAndroidPaypalCheckout(): Promise<void> {
    if (!this.payload) return;
    this.message = 'Creating your secure PayPal checkout…';
    this.refreshView();
    this.paypalReturnListener = await App.addListener('appUrlOpen', ({ url }) => {
      void this.handlePaypalReturn(url);
    });
    this.appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void this.handlePaypalAppResume();
    });

    const order = await firstValueFrom(this.http.post<{ id: string; approvalUrl: string }>('/paypal/create-order', {
      totalCost: this.payload.totalCost,
      addressId: this.payload.addressId,
    }).pipe(timeout({ first: 30000 })));
    if (!order?.id || !order.approvalUrl) throw new Error('PayPal did not return an approval link.');

    this.paypalOrderId = order.id;
    sessionStorage.setItem('pendingPaypalOrderId', order.id);
    this.message = 'Continue securely in Chrome to approve your payment…';
    this.refreshView();
    this.paypalBrowserLaunched = true;
    await PayPalNative.openApprovalInChrome({ url: order.approvalUrl });
  }

  private async handlePaypalAppResume(): Promise<void> {
    if (!this.paypalBrowserLaunched || this.paypalReturnHandled || this.submittingOrder || this.error) return;
    const pendingOrderId = this.paypalOrderId || sessionStorage.getItem('pendingPaypalOrderId');
    if (pendingOrderId) await this.completePaypalOrder(pendingOrderId);
  }

  private async handlePaypalReturn(url: string): Promise<void> {
    let returnUrl: URL;
    try {
      returnUrl = new URL(url);
    } catch {
      return;
    }
    if (returnUrl.protocol !== 'caravan:' || returnUrl.hostname !== 'paypal-return') return;

    const returnedOrderId = returnUrl.searchParams.get('token') || returnUrl.searchParams.get('orderID');
    const cancelled = returnUrl.searchParams.has('cancelled') || !returnedOrderId;
    if (cancelled) {
      this.paypalReturnHandled = true;
      this.processing = false;
      this.message = 'Payment was cancelled. Your cart is still saved.';
      sessionStorage.removeItem('pendingPaypalOrderId');
      this.refreshView();
      return;
    }

    const expectedOrderId = this.paypalOrderId || sessionStorage.getItem('pendingPaypalOrderId');
    if (!expectedOrderId || returnedOrderId !== expectedOrderId) {
      this.showError('The PayPal return did not match this checkout. Your cart is still saved.');
      return;
    }

    await this.completePaypalOrder(returnedOrderId);
  }

  private async completePaypalOrder(orderId: string): Promise<void> {
    if (this.paypalReturnHandled || this.submittingOrder) return;
    this.paypalReturnHandled = true;
    this.message = 'Confirming your PayPal payment…';
    this.refreshView();
    await this.submitOrder(orderId);
  }


  private async submitOrder(paypalOrderId?: string): Promise<boolean> {
    if (!this.payload || this.submittingOrder) return false;
    this.submittingOrder = true;
    this.processing = true;
    this.error = '';
    this.message = this.payload.paymentType === 'cash'
      ? 'Placing your cash on delivery order…'
      : 'Confirming your PayPal payment…';
    this.refreshView();
    try {
      const result = await firstValueFrom(this.http.post<any>('/checkout', {
        ...this.payload,
        ...(paypalOrderId ? { paypalOrderId } : {}),
      }));
      if (!result?.orderId) throw new Error('The order was not confirmed by the server.');

      localStorage.removeItem('cart');
      sessionStorage.removeItem('pendingCheckout');
      sessionStorage.removeItem('pendingPaypalOrderId');
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
    this.refreshView();
  }

  private refreshView(): void {
    this.changeDetector.detectChanges();
  }

  returnToCart(): void {
    void this.router.navigateByUrl('/cart');
  }
}
