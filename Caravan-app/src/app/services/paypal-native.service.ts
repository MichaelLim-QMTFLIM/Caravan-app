import { registerPlugin } from '@capacitor/core';

export interface PayPalNativePlugin {
  openApprovalInChrome(options: { url: string }): Promise<void>;
  initialize(options: { clientId: string; merchantId: string; environment: 'sandbox' | 'live' }): Promise<void>;
  createPayPalSession(options: { email?: string }): Promise<void>;
  startCheckout(options: { orderId: string }): Promise<{ status: 'approved' | 'cancelled' | 'failed'; orderId?: string; message?: string }>;
}

export const PayPalNative = registerPlugin<PayPalNativePlugin>('PayPalNative');
