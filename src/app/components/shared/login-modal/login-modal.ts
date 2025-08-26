import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthPocketbaseService } from '../../../services/auth-pocketbase.service';
import { VirtualRouter } from '../../../services/virtual-router';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-modal.html',
  styleUrl: './login-modal.css'
})
export class LoginModal {
  @ViewChild('emailEl') emailEl!: ElementRef<HTMLInputElement>;
  @ViewChild('passEl') passEl!: ElementRef<HTMLInputElement>;
  @ViewChild('rememberEl') rememberEl!: ElementRef<HTMLInputElement>;

  loading = false;
  errorMsg = '';
  okMsg = '';
  providerNotice = '';
  showPass = false;

  constructor(
    public virtualRouter: VirtualRouter,
    private auth: AuthPocketbaseService) {}

  togglePass() { this.showPass = !this.showPass; }

  async onSubmit(ev: Event) {
    ev.preventDefault();
    this.errorMsg = '';
    this.okMsg = '';
    this.providerNotice = '';
    this.loading = true;

    try {
      const email = this.emailEl.nativeElement.value.trim();
      const pwd = this.passEl.nativeElement.value;
      const remember = !!this.rememberEl.nativeElement.checked;

      const user = await this.auth.login(email, pwd, remember);

      this.okMsg = '¡Sesión iniciada!';

      // Mensaje especial si es proveedor pendiente o rechazado
      const role = (user as any)?.role;
      const providerStatus = (user as any)?.providerStatus;
      if (role === 'proveedor' && providerStatus !== 'approved') {
        this.providerNotice = providerStatus === 'rejected'
          ? 'Tu perfil de proveedor fue rechazado. Contáctanos para más información.'
          : 'Tu perfil de proveedor está en revisión (pendiente de aprobación).';
      }

      // Opcional: cerrar modal automáticamente
      const modal = document.getElementById('login-modal');
      (window as any).bootstrap?.Modal.getOrCreateInstance(modal!)?.hide();
      this.virtualRouter.navigate('dashboard');
    } catch (e: any) {
      this.errorMsg = e?.message || 'Error al iniciar sesión.';
    } finally {
      this.loading = false;
    }
  }
}
