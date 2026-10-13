import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

interface SessionResponse {
  loggedIn: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = false;
  ready = false;

  constructor(private readonly http: HttpClient) {}

  async refresh(): Promise<boolean> {
    try {
      const session = await firstValueFrom(
        this.http.get<SessionResponse>('/api/isLoggedIn').pipe(timeout(3000)),
      );
      this.isAuthenticated = session.loggedIn === true;
    } catch {
      this.isAuthenticated = false;
    } finally {
      this.ready = true;
    }
    return this.isAuthenticated;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/logout', {}));
    } catch {
      // Clear the local account state even when the API is offline.
    } finally {
      this.isAuthenticated = false;
      this.ready = true;
    }
  }
}
