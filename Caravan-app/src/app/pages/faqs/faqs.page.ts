import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonImg,
  IonLabel,
  IonRow,
} from '@ionic/angular';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faqs',
  templateUrl: './faqs.page.html',
  styleUrls: ['./faqs.page.scss'],
  standalone: true,
  imports: [IonContent, RouterLink],
})
export class FaqPage {
  openIndex: number | null = 0; // first item open by default

  faqs: FaqItem[] = [
    {
      question: 'Shipping & Delivery',
      answer:
        'Caravan offers Nationwide shipping, providing convenient and reliable delivery of your herbs, spices, and other products directly to your doorstep. All that is required is to provide your complete and accurate delivery address during checkout. Once your order has been confirmed, you can track its status through the order history page.',
    },
    {
      question: 'Returns & Exchanges',
      answer:
        'Caravan accepts returns and exchanges for eligible orders that arrive damaged, incorrect, or defective. To request a return or exchange, provide your order details and the reason for your request through your account. Our team will review the request and provide further instructions on the return or exchange process.',
    },
    {
      question: 'Product Questions',
      answer:
        "Learn more about Caravan's herbs, spices, and other products, including their origin, description, available sizes, prices, categories, and availability. You may reach us using our dedicated support email or phone number.",
    },
    {
      question: 'My Account',
      answer:
        'Manage your Caravan account and keep your personal information up to date. You can use your account to view and manage your profile, check your order history, track current orders, manage your wishlist, and update your account details.',
    },
  ];

  toggle(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }
}