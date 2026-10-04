import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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

interface HomeFeature {
  icon: string;
  title: string;
  text: string;
}

interface HomeCategory {
  name: string;
  image: string;
}

interface HomeProduct {
  id: number;
  name: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-homepage',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    RouterLink,
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
  ],
})
export class HomePage implements AfterViewInit {
  readonly features: HomeFeature[] = [
    {
      icon: 'assets/Images/Quality.png',
      title: 'Quality Ingredients',
      text: 'Carefully selected ingredients for your kitchen.',
    },
    {
      icon: 'assets/Images/Freshness.png',
      title: 'Freshness You Can Trust',
      text: 'Fresh products packed with care.',
    },
    {
      icon: 'assets/Images/Variety.png',
      title: 'A Wide Variety',
      text: 'Discover ingredients for every kind of recipe.',
    },
    {
      icon: 'assets/Images/Delivery.png',
      title: 'Convenient Shopping',
      text: 'Find your kitchen essentials in one place.',
    },
  ];

  readonly categories: HomeCategory[] = [
    { name: 'Baking', image: 'assets/Images/Baking.jpg' },
    { name: 'Drinking', image: 'assets/Images/Drinking.jpg' },
    { name: 'Cooking', image: 'assets/Images/Cooking.jpg' },
    { name: 'Garnishing', image: 'assets/Images/Garnishing.jpg' },
    { name: 'Medicinal', image: 'assets/Images/Medicinal.jpg' },
  ];

  newArrivals: HomeProduct[] = [];
  popularProducts: HomeProduct[] = [];

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.15 },
    );

    setTimeout(() => {
      this.host.nativeElement
        .querySelectorAll('.fade-title, .category, .card-section ion-card, .explore-wrapper')
        .forEach(element => observer.observe(element));
    }, 300);
  }
}
