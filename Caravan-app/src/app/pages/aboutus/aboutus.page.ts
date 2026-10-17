import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCol, IonRow, IonGrid} from '@ionic/angular';
import { ContentService } from '../../services/content.service';
import { SiteFooterComponent } from '../../components/site-footer/site-footer.component';

@Component({
  selector: 'app-aboutus',
  templateUrl: './aboutus.page.html',
  styleUrls: ['./aboutus.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCol, IonRow, IonGrid, SiteFooterComponent],
})
export class AboutPage implements AfterViewInit, OnInit {
  contentLoading = true;
  aboutTitle = '';
  aboutText = '';
  missionTitle = '';
  missionText = '';
  visionTitle = '';
  visionText = '';

  team = [
    { name: 'Demillo, Orland Gabriel', photo: 'assets/Images/demillo.png' },
    { name: 'Ghazal, Iyad Michael',    photo: 'assets/Images/Ghazal.webp' },
    { name: 'Lim, Michael Terrence',   photo: 'assets/Images/Lim.webp' },
    { name: 'Narvarte, Michael Ray',   photo: 'assets/Images/Narvarte.png' },
    { name: 'Paulino, John Lois',      photo: 'assets/Images/Paulino.jpg' },
  ];

  constructor(
    private host: ElementRef,
    private readonly contentService: ContentService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.loadAboutContent();
  }

  private async loadAboutContent(): Promise<void> {
    try {
      const contents = await this.contentService.fetchAll();
      const about = this.contentService.byTypeName(contents, 'About');
      const mission = this.contentService.byTypeName(contents, 'Mission');
      const vision = this.contentService.byTypeName(contents, 'Vision');
      this.aboutTitle = about?.contentTypeName ?? '';
      this.aboutText = about?.mainText ?? '';
      this.missionTitle = mission?.contentTypeName ?? '';
      this.missionText = mission?.mainText ?? '';
      this.visionTitle = vision?.contentTypeName ?? '';
      this.visionText = vision?.mainText ?? '';
    } catch (error) {
      console.error('Unable to load About page content:', error);
    } finally {
      this.contentLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('show');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.15 }
    );
    this.host.nativeElement
      .querySelectorAll('.fade-title')
      .forEach((el: Element) => observer.observe(el));
  }
}
