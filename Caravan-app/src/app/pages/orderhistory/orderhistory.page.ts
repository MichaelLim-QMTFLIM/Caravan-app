import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';

interface Order {
  orderId: number;
  date: string;
  status: string;
  total: number;
}

@Component({
  selector: 'app-orderhistory',
  templateUrl: './orderhistory.page.html',
  styleUrls: ['./orderhistory.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent
  ]
})
export class OrderhistoryPage {

  sortOption = 'date-desc';
  priceFilter = 'all';

  showReceiptModal = false;
  showRefundModal = false;

  selectedOrder: Order | null = null;

  orders: Order[] = [
    {
      orderId: 5,
      date: '04 Oct 2026',
      status: 'Confirmed',
      total: 834.40
    },
    {
      orderId: 4,
      date: '03 Oct 2026',
      status: 'Delivered',
      total: 1212.40
    },
    {
      orderId: 3,
      date: '01 Oct 2026',
      status: 'Shipped',
      total: 550
    },
    {
      orderId: 5,
      date: '01 Oct 2026',
      status: 'Delivered',
      total: 684
    },
    {
      orderId: 5,
      date: '01 Oct 2026',
      status: 'Shipped',
      total: 510.30
    }
  ];

  openReceipt(order: Order): void {
    this.selectedOrder = order;
    this.showReceiptModal = true;
  }

  closeReceipt(): void {
    this.showReceiptModal = false;
  }

  openRefundModal(): void {
    this.showRefundModal = true;
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
  }

  submitRefund(): void {
    console.log('Refund Requested');
    this.showRefundModal = false;
  }

}