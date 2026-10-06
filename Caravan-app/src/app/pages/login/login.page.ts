import { Component, OnDestroy } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { IonIcon } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

interface LoginResponse {
  error?: string;
  role?: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, NgIf, RouterLink, IonIcon],
})
export class LoginPage implements OnDestroy {
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

  private errorTimer?: ReturnType<typeof setTimeout>;

  constructor(private http: HttpClient, private router: Router) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => (this.errorMessage = ''), 2000);
  }

  async onSubmit(): Promise<void> {
    const email = this.email.trim();
    const password = this.password;

    this.errorMessage = '';

    if (email === '') return this.showError('Please enter your email address.');
    if (!this.validateEmail(email)) return this.showError("That isn't a valid email address.");
    if (password === '') return this.showError('Please enter your password.');
    if (password.length < 6) return this.showError('Password must be at least 6 characters.');

    this.loading = true;

    try {
      const data = await firstValueFrom(
        this.http.post<LoginResponse>('/api/login', { email, password })
      );

      if (data.error) {
        this.showError(data.error);
        return;
      }

      this.router.navigateByUrl(data.role === 'admin' ? '/admin/dashboard' : '/store');
    } catch (err: any) {
      // Non-2xx responses land here; use the server's error message if it sent one
      this.showError(err?.error?.error ?? 'Something went wrong. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.errorTimer);
  }
}