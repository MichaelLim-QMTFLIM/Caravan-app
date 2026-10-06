import { Component, OnDestroy } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonToolbar } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

interface RegisterResponse {
  error?: string;
  login?: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, NgIf, RouterLink, IonToolbar, IonIcon],
})
export class RegisterPage implements OnDestroy {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';

  privacyConsent = false;
  privacyModalOpen = false;

  showPassword = false;
  showConfirmPassword = false;

  loading = false;
  errorMessage = '';
  successMessage = '';

  private errorTimer?: ReturnType<typeof setTimeout>;
  private successTimer?: ReturnType<typeof setTimeout>;

  constructor(private http: HttpClient, private router: Router) {}

  // ---- Privacy modal ----
  openPrivacy(event: Event): void {
    event.preventDefault();
    this.privacyModalOpen = true;
  }

  closePrivacy(): void {
    this.privacyModalOpen = false;
  }

  acceptPrivacy(): void {
    this.privacyConsent = true;
    this.closePrivacy();
  }

  // ---- Helpers ----
  private validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => (this.errorMessage = ''), 2000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    clearTimeout(this.successTimer);
    this.successTimer = setTimeout(() => {
      this.successMessage = '';
      this.router.navigateByUrl('/store');
    }, 2000);
  }

  // ---- Submit ----
  async onSubmit(): Promise<void> {
    const firstName = this.firstName.trim();
    const lastName = this.lastName.trim();
    const email = this.email.trim();
    const password = this.password;

    this.errorMessage = '';
    this.successMessage = '';

    if (firstName === '') return this.showError('Please enter your first name.');
    if (lastName === '') return this.showError('Please enter your last name.');
    if (!this.validateEmail(email)) return this.showError("That isn't a valid email address.");
    if (password.length < 6) return this.showError('Password must be at least 6 characters.');
    if (password !== this.confirmPassword) return this.showError('Passwords do not match.');
    if (!this.privacyConsent) {
      return this.showError('You must agree to the Data Privacy Policy to register.');
    }

    this.loading = true;

    try {
      const data = await firstValueFrom(
        this.http.post<RegisterResponse>('/api/register', { firstName, lastName, email, password })
      );

      if (data.error) {
        this.loading = false;
        this.showError(data.error);
        return;
      }

      if (data.login) {
        this.showSuccess(data.login);
      }
    } catch (err: any) {
      this.loading = false;
      this.showError(err?.error?.error ?? 'Something went wrong. Please try again.');
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.errorTimer);
    clearTimeout(this.successTimer);
  }
}