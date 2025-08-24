import { environment } from '../environments/environment';
import { InjectionToken } from '@angular/core';
export const PB_URL = new InjectionToken<string>('PB_URL', {
  providedIn: 'root',
  factory: () => {
    console.info('[PB_URL] usando:', environment.pocketbaseUrl);
    return environment.pocketbaseUrl;
  }
});
