import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-team-banner',
  standalone: true,
  templateUrl: './team-banner.component.html',
  styleUrls: ['./team-banner.component.scss'],
})
export class TeamBannerComponent implements OnInit {
  @Output() readonly dismiss = new EventEmitter<void>();
  loading = true;
  message = '';

  constructor(
    private readonly contentService: ContentService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.loadBanner();
  }

  private async loadBanner(): Promise<void> {
    try {
      const contents = await this.contentService.fetchAll();
      this.message = this.contentService.byTypeName(contents, 'Banner')?.mainText ?? '';
    } catch (error) {
      console.error('Unable to load the Caravan Team banner:', error);
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }
}
