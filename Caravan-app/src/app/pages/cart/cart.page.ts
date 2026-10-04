import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

interface CartItem {
  id: number;
  name: string;
  size: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
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
export class CartPage {

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

  cartItems: CartItem[] = [
    {
      id: 1,
      name: 'Paprika',
      size: '8 oz',
      category: 'Cooking',
      price: 199.99,
      quantity: 1,
      image: 'assets/Images/pAPRIKA.jpg'
    },
    {
      id: 2,
      name: 'Ajwain Seeds',
      size: '100 g',
      category: 'Spices',
      price: 125,
      quantity: 2,
      image: 'assets/Images/AjwainSeeds.jpg'
    },
    {
      id: 3,
      name: 'Cumin Seeds',
      size: '100 g',
      category: 'Spices',
      price: 150,
      quantity: 2,
      image: 'assets/Images/CuminSeeds.jpg'
    }
  ];

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

  constructor() {
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
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity -= 1;
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
    console.log('Continue shopping clicked');
  }

  viewOrders(): void {
    this.closeCheckoutResult();
    console.log('View orders clicked');
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