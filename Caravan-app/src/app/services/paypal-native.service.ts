import { registerPlugin } from '@capacitor/core';

export interface PayPalNativePlugin {
  initialize(options: { clientId: string; merchantId: string; environment: 'sandbox' | 'live' }): Promise<void>;
  createPayPalSession(options: { email?: string }): Promise<void>;
  startCheckout(options: { orderId: string }): Promise<{ status: 'approved' | 'cancelled' | 'failed'; orderId?: string; message?: string }>;
}

export const PayPalNative = registerPlugin<PayPalNativePlugin>('PayPalNative');
