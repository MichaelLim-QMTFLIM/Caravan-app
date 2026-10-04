import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCol, IonRow, IonGrid} from '@ionic/angular';

@Component({
  selector: 'app-aboutus',
  templateUrl: './aboutus.page.html',
  styleUrls: ['./aboutus.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCol, IonRow, IonGrid],
})
export class AboutPage implements AfterViewInit {
  team = [
    { name: 'Demillo, Orland Gabriel', photo: 'assets/Images/demillo.png' },
    { name: 'Ghazal, Iyad Michael',    photo: 'assets/Images/Ghazal.webp' },
    { name: 'Lim, Michael Terrence',   photo: 'assets/Images/Lim.webp' },
    { name: 'Narvarte, Michael Ray',   photo: 'assets/Images/Narvarte.png' },
    { name: 'Paulino, John Lois',      photo: 'assets/Images/Paulino.jpg' },
  ];

  constructor(private host: ElementRef) {}

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