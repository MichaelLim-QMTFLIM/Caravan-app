import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentService, SiteContent } from '../../services/content.service';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';

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
  imports: [CommonModule, IonContent, RouterLink, SiteFooterComponent],
})
export class FaqPage implements OnInit {
  openIndex: number | null = 0; // first item open by default
  faqs: FaqItem[] = [];
  faqLoading = true;
  faqUnavailable = false;
  contactsLoading = true;
  contactsUnavailable = false;
  email?: SiteContent;
  location?: SiteContent;
  phone?: SiteContent;

  constructor(
    private readonly contentService: ContentService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.loadContent();
  }

  private async loadContent(): Promise<void> {
    try {
      const contents = await this.contentService.fetchAll();
      const faqNames = ['Shipping & Delivery', 'Returns & Exchanges', 'Product Questions', 'My Account'];
      this.faqs = contents
        .filter(content => faqNames.includes(content.contentTypeName))
        .map(content => ({ question: content.contentTypeName, answer: content.mainText }));
      this.email = this.contentService.byTypeName(contents, 'Email');
      this.location = this.contentService.byTypeName(contents, 'Location');
      this.phone = this.contentService.byTypeName(contents, 'Number');
      this.faqUnavailable = this.faqs.length === 0;
      this.contactsUnavailable = !this.email && !this.location && !this.phone;
    } catch (error) {
      console.error('Unable to load FAQ and contact content:', error);
      this.faqUnavailable = true;
      this.contactsUnavailable = true;
    } finally {
      this.faqLoading = false;
      this.contactsLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  toggle(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }

  phoneHref(): string | null {
    const phoneNumber = this.phone?.mainText.replace(/[^\d+]/g, '');
    return phoneNumber ? `tel:${phoneNumber}` : null;
  }
}
