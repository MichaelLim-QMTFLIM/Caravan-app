import { ChangeDetectorRef, Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  remove,
  trashOutline,
  cardOutline,
  cashOutline,
  cartOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { firstValueFrom, timeout } from 'rxjs';
import { SettingsService } from '../../services/settings.service';

interface CartItem {
  id: number;
  isBundle: boolean;
  productId: number;
  name: string;
  size: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
}

interface StoredCartItem {
  cartprod_id: number | null;
  cartbundle_id: number | null;
  cartprod_size: string;
  quantity: number;
  isBundle: boolean;
}

interface CatalogProduct {
  product_id: number;
  type_id: number;
  product_name: string;
  product_image: string;
  product_price: number;
  product_category?: Array<{ category_name?: string }>;
}

interface Voucher {
  id: number;
  name: string;
  code: string;
  description: string;
  discountPercentage: number;
}

interface ShippingOption {
  id: number;
  name: string;
  description: string;
  fee: number;
}

interface Address {
  id: number;
  street: string;
  city: string;
  zipCode: string;
}

type PaymentMethod = 'paypal' | 'cash' | null;

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon, IonSpinner],
})
export class CartPage {
  loading = true;
  loadingError = '';
  checkoutError = '';
  checkoutWarnings: string[] = [];
  selectedShippingId: number | null = null;
  selectedVoucherId: number | null = null;
  selectedAddressId: number | null = null;
  selectedPaymentMethod: PaymentMethod = null;
  showDeleteModal = false;
  showDeleteAllModal = false;
  showCheckoutModal = false;
  itemToDeleteId: number | null = null;
  cartItems: CartItem[] = [];
  vouchers: Voucher[] = [];
  shippingOptions: ShippingOption[] = [];
  addresses: Address[] = [];
  private storedCart: StoredCartItem[] = [];

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly settings: SettingsService,
  ) {
    addIcons({
      add,
      remove,
      trashOutline,
      cardOutline,
      cashOutline,
      cartOutline,
      alertCircleOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.loadCart();
  }

  get productsCost(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get selectedVoucher(): Voucher | undefined {
    return this.vouchers.find(voucher => voucher.id === Number(this.selectedVoucherId));
  }

  get selectedShipping(): ShippingOption | undefined {
    return this.shippingOptions.find(option => option.id === Number(this.selectedShippingId));
  }

  get discountAmount(): number {
    return this.selectedVoucher
      ? this.productsCost * this.selectedVoucher.discountPercentage / 100
      : 0;
  }

  get totalCost(): number {
    return Math.max(0, this.productsCost + (this.selectedShipping?.fee ?? 0) - this.discountAmount);
  }

  private async loadCart(): Promise<void> {
    this.loading = true;
    this.loadingError = '';
    try {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem('cart') || '[]');
        this.storedCart = Array.isArray(parsed)
          ? parsed.filter((entry): entry is StoredCartItem => !!entry && typeof entry === 'object')
          : [];
      } catch {
        this.storedCart = [];
      }

      const [productResult, addressResult, voucherResult, shippingResult] = await Promise.allSettled([
        this.storedCart.length
          ? firstValueFrom(this.http.get<CatalogProduct[]>('/api/fetchProducts').pipe(timeout({ first: 10000 })))
          : Promise.resolve([] as CatalogProduct[]),
        firstValueFrom(this.http.get<any[]>('/api/addresses').pipe(timeout({ first: 10000 }))),
        firstValueFrom(this.http.get<any[]>('/vouchers/me').pipe(timeout({ first: 10000 }))),
        firstValueFrom(this.http.get<any[]>('/shipping').pipe(timeout({ first: 10000 }))),
      ]);

      if (productResult.status === 'fulfilled') {
        const catalog = Array.isArray(productResult.value) ? productResult.value : [];
        this.cartItems = this.storedCart.flatMap((entry, index) => {
          const isBundle = !!entry.isBundle;
          const productId = Number(isBundle ? entry.cartbundle_id : entry.cartprod_id);
          const product = catalog.find(candidate =>
            Number(candidate.product_id) === productId && (Number(candidate.type_id) === 2) === isBundle,
          );
          if (!product) return [];
          const ounces = entry.cartprod_size === '16oz' ? 16 : 8;
          return [{
            id: index + 1,
            isBundle,
            productId,
            name: product.product_name || (isBundle ? 'Bundle' : 'Product'),
            size: `${ounces} oz`,
            category: product.product_category?.[0]?.category_name || (isBundle ? 'Bundle' : 'Spices'),
            price: Number(product.product_price) * ounces,
            quantity: Math.max(1, Number(entry.quantity) || 1),
            image: product.product_image || 'assets/Images/ItemNotFound_nobg.png',
          }];
        });
        this.persistCart();
      } else {
        this.cartItems = [];
        this.loadingError = 'Unable to load cart products. Your saved cart is still available; please refresh to try again.';
        console.error('Unable to load cart products:', productResult.reason);
      }

      if (addressResult.status === 'fulfilled') {
        this.addresses = (Array.isArray(addressResult.value) ? addressResult.value : []).map(row => ({
          id: Number(row.Address_id ?? row.address_id),
          street: row.Street_address ?? row.street_address ?? '',
          city: row.City ?? row.city ?? '',
          zipCode: String(row.Zip_code ?? row.zip_code ?? ''),
        }));
      } else {
        this.loadingError ||= 'Unable to load your saved delivery addresses.';
        console.error('Unable to load addresses:', addressResult.reason);
      }

      if (voucherResult.status === 'fulfilled') {
        this.vouchers = (Array.isArray(voucherResult.value) ? voucherResult.value : []).map(row => ({
          id: Number(row.Voucher_id ?? row.id),
          name: row.Voucher_name ?? row.name ?? '',
          code: row.Voucher_name ?? row.code ?? `Voucher ${row.Voucher_id}`,
          description: row.Voucher_desc ?? row.description ?? '',
          discountPercentage: Number(row.discount ?? row.discountPercentage) || 0,
        }));
      } else {
        this.loadingError ||= 'Unable to load your available vouchers.';
        console.error('Unable to load vouchers:', voucherResult.reason);
      }
      if (!this.vouchers.length) this.selectedVoucherId = 0;

      if (shippingResult.status === 'fulfilled') {
        this.shippingOptions = (Array.isArray(shippingResult.value) ? shippingResult.value : []).map(row => ({
          id: Number(row.Shipping_id ?? row.id),
          name: row.Shipping_name ?? row.name ?? 'Shipping',
          description: row.Shipping_text ?? row.description ?? '',
          fee: Number(row.Cost ?? row.fee) || 0,
        }));
      } else {
        this.loadingError ||= 'Unable to load shipping options.';
        console.error('Unable to load shipping options:', shippingResult.reason);
      }

    } catch (error) {
      this.loadingError ||= 'Unable to load your cart. Please refresh to try again.';
      console.error('Cart loading failed:', error);
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }

  private persistCart(): void {
    this.storedCart = this.cartItems.map(item => ({
      cartprod_id: item.isBundle ? null : item.productId,
      cartbundle_id: item.isBundle ? item.productId : null,
      cartprod_size: item.size.replace(/\s/g, ''),
      quantity: item.quantity,
      isBundle: item.isBundle,
    }));
    localStorage.setItem('cart', JSON.stringify(this.storedCart));
  }

  increaseQuantity(item: CartItem): void {
    item.quantity += 1;
    this.persistCart();
    this.clearCheckoutWarnings();
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity <= 1) return;
    item.quantity -= 1;
    this.persistCart();
    this.clearCheckoutWarnings();
  }

  openDeleteModal(itemId: number): void {
    this.itemToDeleteId = itemId;
    this.showDeleteModal = true;
  }

  confirmDeleteItem(): void {
    if (this.itemToDeleteId === null) return;
    this.cartItems = this.cartItems.filter(item => item.id !== this.itemToDeleteId);
    this.persistCart();
    this.cancelDeleteItem();
    this.clearCheckoutWarnings();
  }

  cancelDeleteItem(): void {
    this.itemToDeleteId = null;
    this.showDeleteModal = false;
  }

  confirmDeleteAll(): void {
    this.cartItems = [];
    this.persistCart();
    this.showDeleteAllModal = false;
    this.clearCheckoutWarnings();
  }

  selectPaymentMethod(method: Exclude<PaymentMethod, null>): void {
    this.selectedPaymentMethod = method;
    this.clearCheckoutWarnings();
  }

  openCheckoutModal(): void {
    this.checkoutWarnings = [];
    this.checkoutError = '';
    if (!this.cartItems.length) return;
    if (this.selectedShippingId === null) this.checkoutWarnings.push('Please select a shipping option.');
    if (this.selectedVoucherId === null) this.checkoutWarnings.push('Please select a voucher or choose to continue without one.');
    if (this.addresses.length && this.selectedAddressId === null) this.checkoutWarnings.push('Please select a delivery address.');
    if (!this.addresses.length) this.checkoutWarnings.push('You have no saved address. Please create one before checkout.');
    if (!this.selectedPaymentMethod) this.checkoutWarnings.push('Please select a payment method.');
    if (this.checkoutWarnings.length) return;

    this.showCheckoutModal = true;
  }

  cancelCheckout(): void {
    this.showCheckoutModal = false;
  }

  async confirmCheckout(): Promise<void> {
    if (!this.selectedShipping || this.selectedAddressId === null || !this.selectedPaymentMethod) return;
    this.showCheckoutModal = false;
    const payload = {
      items: this.cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        productSize: item.size.replace(/\s/g, ''),
      })),
      addressId: this.selectedAddressId,
      methodId: this.selectedPaymentMethod === 'cash' ? 2 : null,
      paymentType: this.selectedPaymentMethod,
      shippingId: this.selectedShipping.id,
      voucherId: this.selectedVoucherId && this.selectedVoucherId > 0 ? this.selectedVoucherId : null,
      totalCost: this.totalCost,
    };
    sessionStorage.setItem('pendingCheckout', JSON.stringify(payload));
    await this.router.navigateByUrl('/checkout/processing');
  }

  goToAddresses(): void {
    void this.router.navigate(['/profile'], { queryParams: { tab: 'addresses' } });
  }

  clearCheckoutWarnings(): void {
    this.checkoutWarnings = [];
    this.checkoutError = '';
  }

  formatCurrency(value: number): string {
    return this.settings.formatCurrency(value);
  }
}
