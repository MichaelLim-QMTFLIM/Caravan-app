import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-team-banner',
  standalone: true,
  templateUrl: './team-banner.component.html',
  styleUrls: ['./team-banner.component.scss'],
})
export class TeamBannerComponent {
  @Output() readonly dismiss = new EventEmitter<void>();
}
