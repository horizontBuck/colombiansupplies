import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VirtualRouter {
  activateRoute="home";

  constructor() {
    this.activateRoute="home";
  }

  navigate(route: string) {
    this.activateRoute=route;
  }
}
