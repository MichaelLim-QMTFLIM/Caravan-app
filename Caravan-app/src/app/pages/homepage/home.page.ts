import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-homepage',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class CartPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

import { AfterViewInit, ElementRef } from '@angular/core';

// add to the class: implements OnInit, AfterViewInit
constructor(private host: ElementRef) {
  addIcons({ cartOutline, personOutline }); // remove if you deleted the navbar icons
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

  // Products load async, so wait a tick (or call this again after your data arrives)
  setTimeout(() => {
    this.host.nativeElement
      .querySelectorAll('.fade-title, .category, .card-section ion-card, .explore-wrapper')
      .forEach((el: Element) => observer.observe(el));
  }, 300);
}