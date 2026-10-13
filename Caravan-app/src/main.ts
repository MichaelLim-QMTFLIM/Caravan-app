import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { provideHttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  add,
  cartOutline,
  cashOutline,
  cardOutline,
  checkmarkCircleOutline,
  eyeOffOutline,
  eyeOutline,
  helpCircleOutline,
  homeOutline,
  informationCircleOutline,
  logInOutline,
  person,
  personAddOutline,
  personCircleOutline,
  personOutline,
  receiptOutline,
  remove,
  storefrontOutline,
  trashOutline,
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

addIcons({
  add,
  cartOutline,
  cashOutline,
  cardOutline,
  checkmarkCircleOutline,
  eyeOffOutline,
  eyeOutline,
  helpCircleOutline,
  homeOutline,
  informationCircleOutline,
  logInOutline,
  person,
  personAddOutline,
  personCircleOutline,
  personOutline,
  receiptOutline,
  remove,
  storefrontOutline,
  trashOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
