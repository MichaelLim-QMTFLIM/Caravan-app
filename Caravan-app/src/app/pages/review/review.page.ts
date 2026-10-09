import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

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
  IonHeader
} from '@ionic/angular';

interface Review {
  name: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule,
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
    IonHeader
  ],
  templateUrl: './reviews.page.html',
  styleUrls: ['./reviews.page.scss'],
})

export class ReviewsPage {
  readonly starValues = [1, 2, 3, 4, 5];
  readonly cardsPerPage = 6;

  reviews: Review[] = [];
  currentPage = 0;

  modalOpen = false;
  rating = 5;
  hoverRating = 0;
  form = { name: '', title: '', comment: '' };

  // ---------- Pagination ----------

  get totalPages(): number {
    return Math.ceil(this.reviews.length / this.cardsPerPage);
  }

  get pagedReviews(): Review[] {
    const start = this.currentPage * this.cardsPerPage;
    return this.reviews.slice(start, start + this.cardsPerPage);
  }

  get canGoPrev(): boolean {
    return this.currentPage > 0;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  prev() {
    if (this.canGoPrev) this.currentPage--;
  }

  next() {
    if (this.canGoNext) this.currentPage++;
  }

  // ---------- Modal ----------

  openModal() {
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
  }

  // ---------- Star rating ----------

  get shownRating(): number {
    return this.hoverRating || this.rating;
  }

  starString(count: number): string {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  }

  // ---------- Submit ----------

  submit(ngForm: NgForm) {
    const name = this.form.name.trim();
    const title = this.form.title.trim();
    const comment = this.form.comment.trim();
    if (!name || !title || !comment) return;

    const date = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Newest review first. Angular escapes interpolated text, so no manual escapeHTML is needed.
    // TODO: POST the review to your backend here.
    this.reviews.unshift({ name, rating: this.rating, title, comment, date });
    this.currentPage = 0;

    ngForm.resetForm();
    this.form = { name: '', title: '', comment: '' };
    this.rating = 5;
    this.hoverRating = 0;
    this.closeModal();
  }
}