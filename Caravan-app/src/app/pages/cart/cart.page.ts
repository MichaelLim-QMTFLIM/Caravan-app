import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  add,
  remove,
  trashOutline,
  cardOutline,
  cashOutline,
  cartOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

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
  code: string;
  description: string;
  discountPercentage: number;
}

interface Address {
  id: number;
  street: string;
  city: string;
  zipCode: string;
}

type PaymentMethod = 'card' | 'cash' | null;

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class CartPage implements OnInit {

  shippingFee = 50;

  selectedVoucherId: number | null = null;
  selectedAddressId: number | null = null;
  selectedPaymentMethod: PaymentMethod = null;

  showDeleteModal = false;
  showCheckoutModal = false;
  showCheckoutResultModal = false;
  isProcessingCheckout = false;
  checkoutSuccessful = false;

  itemToDeleteId: number | null = null;

  cartItems: CartItem[] = [];
  private storedCart: StoredCartItem[] = [];

  vouchers: Voucher[] = [
    {
      id: 1,
      code: 'WELCOME10',
      description: 'Get 10% off your order.',
      discountPercentage: 10
    }
  ];

  addresses: Address[] = [
    {
      id: 1,
      street: '4009 Wooden Street',
      city: 'Quezon City',
      zipCode: '1803'
    },
    {
      id: 2,
      street: '67 Kiddie Avenue',
      city: 'Marikina City',
      zipCode: '1801'
    }
  ];

  constructor(private http: HttpClient, private router: Router) {
    addIcons({
      add,
      remove,
      trashOutline,
      cardOutline,
      cashOutline,
      cartOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit(): void {
    void this.loadCart();
  }

  private async loadCart(): Promise<void> {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('cart') || '[]');
      this.storedCart = Array.isArray(parsed) ? parsed as StoredCartItem[] : [];
    } catch {
      this.storedCart = [];
    }
    if (!this.storedCart.length) {
      this.cartItems = [];
      return;
    }

    try {
      const products = await firstValueFrom(this.http.get<CatalogProduct[]>('/api/fetchProducts'));
      const catalog = Array.isArray(products) ? products : [];
      this.cartItems = this.storedCart.flatMap((entry, index) => {
        const isBundle = !!entry.isBundle;
        const productId = Number(isBundle ? entry.cartbundle_id : entry.cartprod_id);
        const product = catalog.find(candidate => Number(candidate.product_id) === productId);
        if (!product || (Number(product.type_id) === 2) !== isBundle) return [];
        const ounces = entry.cartprod_size === '16oz' ? 16 : 8;
        return [{
          id: index + 1,
          isBundle,
          productId,
          name: product.product_name,
          size: `${ounces} oz`,
          category: product.product_category?.[0]?.category_name || (isBundle ? 'Bundle' : 'Spices'),
          price: Number(product.product_price) * ounces,
          quantity: Math.max(1, Number(entry.quantity) || 1),
          image: product.product_image,
        }];
      });
      this.persistCart();
    } catch (error) {
      console.error('Unable to load cart products', error);
      this.cartItems = [];
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

  get productsCost(): number {
    return this.cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  get selectedVoucher(): Voucher | undefined {
    return this.vouchers.find(
      voucher => voucher.id === Number(this.selectedVoucherId)
    );
  }

  get discountAmount(): number {
    if (!this.selectedVoucher) {
      return 0;
    }

    return (
      this.productsCost *
      (this.selectedVoucher.discountPercentage / 100)
    );
  }

  get totalCost(): number {
    if (this.cartItems.length === 0) {
      return 0;
    }

    return Math.max(
      0,
      this.productsCost + this.shippingFee - this.discountAmount
    );
  }

  get canCheckout(): boolean {
    return (
      this.cartItems.length > 0 &&
      this.selectedAddressId !== null &&
      this.selectedPaymentMethod !== null
    );
  }

  increaseQuantity(item: CartItem): void {
    item.quantity += 1;
    this.persistCart();
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity -= 1;
      this.persistCart();
    }
  }

  openDeleteModal(itemId: number): void {
    this.itemToDeleteId = itemId;
    this.showDeleteModal = true;
  }

  confirmDeleteItem(): void {
    if (this.itemToDeleteId === null) {
      return;
    }

    this.cartItems = this.cartItems.filter(
      item => item.id !== this.itemToDeleteId
    );
    this.persistCart();

    this.cancelDeleteItem();
  }

  cancelDeleteItem(): void {
    this.itemToDeleteId = null;
    this.showDeleteModal = false;
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod = method;
  }

  openCheckoutModal(): void {
    if (!this.canCheckout) {
      return;
    }

    this.showCheckoutModal = true;
  }

  cancelCheckout(): void {
    this.showCheckoutModal = false;
  }

  confirmCheckout(): void {
    this.showCheckoutModal = false;
    this.showCheckoutResultModal = true;
    this.isProcessingCheckout = true;
    this.checkoutSuccessful = false;

    // Temporary frontend simulation only.
    setTimeout(() => {
      this.isProcessingCheckout = false;
      this.checkoutSuccessful = true;
    }, 1200);
  }

  continueShopping(): void {
    this.closeCheckoutResult();
    void this.router.navigateByUrl('/store');
  }

  viewOrders(): void {
    this.closeCheckoutResult();
    void this.router.navigateByUrl('/orderhistory');
  }

  closeCheckoutResult(): void {
    this.showCheckoutResultModal = false;
    this.isProcessingCheckout = false;
    this.checkoutSuccessful = false;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP'
    });
  }
}
