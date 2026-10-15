import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

interface ConfirmationDetails {
  orderId: number;
  email: string;
  emailSent: boolean;
  paymentType: 'cash' | 'paypal';
}

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner, RouterLink],
  templateUrl: './order-confirmation.page.html',
  styleUrls: ['./order-confirmation.page.scss'],
})
export class OrderConfirmationPage implements OnInit {
  orderId = '';
  email = '';
  emailSent = false;
  loading = false;
  private hasConfirmation = false;

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    addIcons({ checkmarkCircleOutline });
  }

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId') || '';
    try {
      const details = JSON.parse(sessionStorage.getItem('checkoutConfirmation') || 'null') as ConfirmationDetails | null;
      if (details && String(details.orderId) === this.orderId) {
        this.hasConfirmation = true;
        this.email = details.email || '';
        this.emailSent = details.emailSent;
      }
    } catch {
      // Fetch the email from the signed-in profile below if session state is unavailable.
    }
    if (!this.orderId || !this.hasConfirmation) {
      void this.router.navigateByUrl('/orderhistory');
      return;
    }
    if (!this.email && !this.emailSent) void this.loadCustomerEmail();
  }

  private async loadCustomerEmail(): Promise<void> {
    this.loading = true;
    try {
      const profile = await firstValueFrom(this.http.get<{ email?: string }>('/api/profile'));
      this.email = profile.email || '';
    } catch (error) {
      console.error('Unable to load the receipt email:', error);
    } finally {
      this.loading = false;
    }
  }
}
