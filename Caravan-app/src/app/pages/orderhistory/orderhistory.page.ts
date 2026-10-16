import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IonContent, IonSpinner } from '@ionic/angular';
import { SettingsService } from '../../services/settings.service';

interface Order {
  orderId: number;
  date: string;
  status: string;
  total: number;
  shippingFee: number;
  discount: number;
}

interface ReceiptItem {
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  size: number | string;
}

interface OrderReceipt extends Order {
  address: string;
  shippingName: string;
  items: ReceiptItem[];
}

interface RefundRequest {
  orderId: number;
  status: string;
}

@Component({
  selector: 'app-orderhistory',
  templateUrl: './orderhistory.page.html',
  styleUrls: ['./orderhistory.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonSpinner],
})
export class OrderhistoryPage implements OnInit {
  sortOption = 'date-desc';
  priceFilter = 'all';
  currentPage = 1;
  readonly pageSize = 5;

  loading = true;
  receiptLoading = false;
  submittingRefund = false;
  error = '';
  refundError = '';

  showReceiptModal = false;
  showRefundModal = false;
  refundAlreadyRequested = false;
  refundNotice = '';
  selectedOrder: Order | null = null;
  selectedReceipt: OrderReceipt | null = null;
  refundSubject = '';
  refundReason = '';

  orders: Order[] = [];
  refundRequests: RefundRequest[] = [];

  constructor(
    private readonly http: HttpClient,
    private readonly changeDetector: ChangeDetectorRef,
    readonly settings: SettingsService,
  ) {}

  ngOnInit(): void {
    void this.loadOrders();
  }

  get visibleOrders(): Order[] {
    const filtered = this.filteredAndSortedOrders;
    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  formatCurrency(value: number): string {
    return this.settings.formatCurrency(value);
  }

  get filteredAndSortedOrders(): Order[] {
    let result = [...this.orders];
    if (this.priceFilter === '0-500') result = result.filter(order => order.total <= 500);
    if (this.priceFilter === '501-1000') result = result.filter(order => order.total >= 501 && order.total <= 1000);
    if (this.priceFilter === '1001-5000') result = result.filter(order => order.total >= 1001 && order.total <= 5000);
    if (this.priceFilter === '5001+') result = result.filter(order => order.total >= 5001);

    switch (this.sortOption) {
      case 'date-asc': result.sort((a, b) => this.timestamp(a.date) - this.timestamp(b.date)); break;
      case 'order-desc': result.sort((a, b) => b.orderId - a.orderId); break;
      case 'order-asc': result.sort((a, b) => a.orderId - b.orderId); break;
      default: result.sort((a, b) => this.timestamp(b.date) - this.timestamp(a.date));
    }
    return result;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAndSortedOrders.length / this.pageSize));
  }

  get refundAlreadyExistsForSelectedOrder(): boolean {
    return !!this.selectedOrder && this.hasRefundRequest(this.selectedOrder.orderId);
  }

  async loadOrders(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const [orderRows, refundRows] = await Promise.all([
        firstValueFrom(this.http.get<any[]>('/orders')),
        firstValueFrom(this.http.get<any[]>('/returns/me')).catch(() => []),
      ]);
      this.orders = orderRows.map(row => ({
        orderId: Number(row.Order_id ?? row.order_id),
        date: String(row.Order_date ?? row.order_date ?? ''),
        status: String(row.Order_status ?? row.order_status ?? 'Processing'),
        total: Number(row.Total_cost ?? row.total_cost) || 0,
        shippingFee: Number(row.Shipping_fee ?? row.shipping_fee) || 0,
        discount: Number(row.Discount ?? row.discount) || 0,
      }));
      this.refundRequests = refundRows.map(row => ({
        orderId: Number(row.Order_id ?? row.order_id),
        status: String(row.Return_status ?? row.return_status ?? ''),
      }));
      this.clampPage();
    } catch (error: any) {
      console.error('Unable to load orders:', error);
      this.error = error?.status === 401
        ? 'Please sign in to see your orders.'
        : 'Unable to load your orders. Please Check your Internet Connection.';
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }

  filtersChanged(): void {
    this.currentPage = 1;
  }

  goToPage(value: unknown): void {
    const page = Number(value);
    if (!Number.isFinite(page)) return;
    this.currentPage = Math.max(1, Math.min(this.totalPages, Math.trunc(page)));
  }

  previousPage(): void { this.goToPage(this.currentPage - 1); }
  nextPage(): void { this.goToPage(this.currentPage + 1); }

  async openReceipt(order: Order): Promise<void> {
    this.selectedOrder = order;
    this.selectedReceipt = null;
    this.showReceiptModal = true;
    this.receiptLoading = true;
    try {
      const rows = await firstValueFrom(this.http.get<any[]>(`/orders/${order.orderId}`));
      if (!rows.length) throw new Error('No receipt details were returned.');
      const first = rows[0];
      this.selectedReceipt = {
        ...order,
        orderId: Number(first.Order_id ?? first.order_id ?? order.orderId),
        status: String(first.Order_status ?? first.order_status ?? order.status),
        total: Number(first.Total_cost ?? first.total_cost ?? order.total) || 0,
        shippingFee: Number(first.Shipping_fee ?? first.shipping_fee ?? order.shippingFee) || 0,
        discount: Number(first.Discount ?? first.discount ?? order.discount) || 0,
        address: [first.Street_address ?? first.street_address, first.City ?? first.city, first.Zip_code ?? first.zip_code]
          .filter(value => value !== null && value !== undefined && String(value).trim())
          .join(', '),
        shippingName: String(first.Shipping_name ?? first.shipping_name ?? ''),
        items: rows.map(item => ({
          name: String(item.Prod_name ?? item.product_name ?? 'Product'),
          image: String(item.Prod_img ?? item.product_image ?? ''),
          quantity: Number(item.Quantity ?? item.quantity) || 0,
          unitPrice: Number(item.Unit_price ?? item.unit_price) || 0,
          size: item.Product_size ?? item.Product_Size ?? item.product_size ?? '',
        })),
      };
    } catch (error) {
      console.error('Unable to load order receipt:', error);
      this.error = 'Unable to load the receipt for this order.';
    } finally {
      this.receiptLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  closeReceipt(): void {
    this.showReceiptModal = false;
    this.selectedReceipt = null;
  }

  openRefundModal(): void {
    this.refundError = '';
    this.refundSubject = '';
    this.refundReason = '';
    this.refundAlreadyRequested = !!this.selectedOrder && this.hasRefundRequest(this.selectedOrder.orderId);
    this.refundNotice = this.refundAlreadyRequested ? 'A refund has already been requested for this order.' : '';
    this.showRefundModal = true;
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
  }

  async submitRefund(): Promise<void> {
    if (!this.selectedOrder) return;
    if (this.hasRefundRequest(this.selectedOrder.orderId)) {
      this.refundAlreadyRequested = true;
      return;
    }
    const subject = this.refundSubject.trim();
    const reason = this.refundReason.trim();
    if (!subject || !reason) {
      this.refundError = 'Enter both a subject and a reason.';
      return;
    }

    this.submittingRefund = true;
    this.refundError = '';
    try {
      await firstValueFrom(this.http.post('/returns', {
        orderId: this.selectedOrder.orderId,
        subject,
        reason,
      }));
      this.refundRequests = [...this.refundRequests, { orderId: this.selectedOrder.orderId, status: 'Pending' }];
      this.refundAlreadyRequested = true;
      this.refundNotice = 'Your refund request was submitted successfully.';
      this.refundSubject = '';
      this.refundReason = '';
    } catch (error: any) {
      if (error?.status === 409) {
        this.refundAlreadyRequested = true;
        this.refundNotice = 'A refund has already been requested for this order.';
      } else {
        this.refundError = error?.error?.error || 'Unable to submit your refund request.';
      }
    } finally {
      this.submittingRefund = false;
      this.changeDetector.detectChanges();
    }
  }

  hasRefundRequest(orderId: number): boolean {
    return this.refundRequests.some(request => request.orderId === orderId);
  }

  formatDate(value: string): string {
    if (!value) return '—';
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnly) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dateOnly[3]}-${months[Number(dateOnly[2]) - 1]}-${dateOnly[1]}`;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
    }).format(date).replace(/ /g, '-');
  }

  formatSize(value: number | string): string {
    if (value === '' || value === null || value === undefined) return '';
    const size = Number(value);
    return Number.isFinite(size) ? `${size}oz` : String(value);
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  private timestamp(value: string): number {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private clampPage(): void {
    this.currentPage = Math.min(Math.max(1, this.currentPage), this.totalPages);
  }
}
