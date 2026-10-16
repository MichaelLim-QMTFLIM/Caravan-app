import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { AppTheme, PesoStyle, SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, IonContent],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  readonly currencyStyles: PesoStyle[] = ['₱', 'Php', 'PHP', 'PhP', 'P'];

  constructor(readonly settings: SettingsService) {}

  setTheme(value: string): void {
    this.settings.setTheme(value as AppTheme);
  }
}
