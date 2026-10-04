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
      icon: 'assets/Images/Cart.png',
      title: 'PURCHASE SECURELY',
      text: 'Buy your herbs and spices with our secure and easy payment process.',
    },
    {
      icon: 'assets/Images/Truck.png',
      title: 'SHIPPED TO YOU',
      text: 'Get your package safely delivered to your doorstep.',
    },
    {
      icon: 'assets/Images/Checklist.png',
      title: 'DEDICATED RECIPES',
      text: 'We offer a list of recipes you can cook using our herbs and spices.',
    },
    {
      icon: 'assets/Images/Wallet.png',
      title: 'SAVE MORE',
      text: 'Buying bundles will cost less than buying them individually.',
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
