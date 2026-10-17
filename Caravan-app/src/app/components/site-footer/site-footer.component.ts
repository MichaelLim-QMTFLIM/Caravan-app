import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ContentService, SiteContent } from '../../services/content.service';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss'],
})
export class SiteFooterComponent implements OnInit {
  loading = true;
  unavailable = false;
  email?: SiteContent;
  location?: SiteContent;
  phone?: SiteContent;

  constructor(
    private readonly contentService: ContentService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.loadContactInformation();
  }

  private async loadContactInformation(): Promise<void> {
    try {
      const contents = await this.contentService.fetchAll();
      this.email = this.contentService.byTypeName(contents, 'Email');
      this.location = this.contentService.byTypeName(contents, 'Location');
      this.phone = this.contentService.byTypeName(contents, 'Number');
      this.unavailable = !this.email && !this.location && !this.phone;
    } catch (error) {
      console.error('Unable to load footer contact information:', error);
      this.unavailable = true;
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }

  phoneHref(): string | null {
    const phoneNumber = this.phone?.mainText.replace(/[^\d+]/g, '');
    return phoneNumber ? `tel:${phoneNumber}` : null;
  }
}
