import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/ui/header/header-component/header-component';
import { FooterComponent } from './components/ui/footer/footer-component/footer-component';
import { LoginModal } from './components/shared/login-modal/login-modal';
import { RegisterModal } from './components/shared/register-modal/register-modal';
import { ChangePassword } from './components/shared/change-password/change-password';
import { ForgotPassword } from './components/shared/forgot-password/forgot-password';
import { Cursor } from './components/shared/cursor/cursor';
import { BackToTop } from './components/shared/back-to-top/back-to-top';
import { Home } from './components/views/home/home';
import { All } from './components/views/all/all';
import { Detail } from './components/views/detail/detail';
import { Dashboard } from './components/views/dashboard/dashboard';
import { VirtualRouter } from './services/virtual-router';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,

    LoginModal,
    RegisterModal,
    ChangePassword,
    ForgotPassword,
    Cursor,
    BackToTop,

    All,
    Home,
    Detail,
    Dashboard,
    
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('colombia-tours');
  constructor( public virtualRouter: VirtualRouter) {
    this.virtualRouter.navigate('home');
  }
}
