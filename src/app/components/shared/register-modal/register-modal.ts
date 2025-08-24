import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthPocketbaseService } from '../../../services/auth-pocketbase.service';
import { EmailService } from '../../../services/email.service';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './register-modal.html',
  styleUrl: './register-modal.css'
})
export class RegisterModal {
  @ViewChild('nameEl') nameEl!: ElementRef<HTMLInputElement>;
  @ViewChild('emailEl') emailEl!: ElementRef<HTMLInputElement>;
  @ViewChild('passEl') passEl!: ElementRef<HTMLInputElement>;
  @ViewChild('pass2El') pass2El!: ElementRef<HTMLInputElement>;
  @ViewChild('agreeEl') agreeEl!: ElementRef<HTMLInputElement>;
  @ViewChild('accountTypeEl') accountTypeEl!: ElementRef<HTMLSelectElement>;
  @ViewChild('businessEl') businessEl!: ElementRef<HTMLInputElement>;

  loading = false;
  errorMsg = '';
  okMsg = '';
  accountTypeValue: 'cliente' | 'proveedor' = 'cliente';
  showPass = false;
  showPass2 = false;

  constructor(private auth: AuthPocketbaseService,
    public emailService: EmailService
  ) {}

  onAccountTypeChange(ev: Event) {
    const sel = ev.target as HTMLSelectElement;
    this.accountTypeValue = (sel.value as 'cliente' | 'proveedor') || 'cliente';
  }

  togglePass() { this.showPass = !this.showPass; }
  togglePass2() { this.showPass2 = !this.showPass2; }

  /* async onSubmit(ev: Event) {
    ev.preventDefault();
    this.errorMsg = '';
    this.okMsg = '';
    this.loading = true;

    try {
      const dto = {
        name: this.nameEl.nativeElement.value.trim(),
        email: this.emailEl.nativeElement.value.trim(),
        password: this.passEl.nativeElement.value,
        passwordConfirm: this.pass2El.nativeElement.value,
        agree: this.agreeEl.nativeElement.checked,
        accountType: this.accountTypeValue,
        businessName: this.accountTypeValue === 'proveedor'
          ? this.businessEl.nativeElement.value.trim()
          : undefined
      } as const;

      await this.auth.register(dto);
      
      this.okMsg = this.accountTypeValue === 'proveedor'
        ? 'Cuenta creada. Tu perfil de proveedor está pendiente de aprobación.'
        : '¡Cuenta creada con éxito!';

      // Opcional: cerrar modal automáticamente
      // const modal = document.getElementById('register-modal');
      // (window as any).bootstrap?.Modal.getOrCreateInstance(modal!)?.hide();
    } catch (e: any) {
      this.errorMsg = e?.message || 'Error en el registro.';
    } finally {
      this.loading = false;
    }
  } */
  // register-modal.ts (solo muestra el método onSubmit con el envío de correo)
async onSubmit(ev: Event) {
  ev.preventDefault();
  this.errorMsg = '';
  this.okMsg = '';
  this.loading = true;

  try {
    const dto = {
      name: this.nameEl.nativeElement.value.trim(),
      email: this.emailEl.nativeElement.value.trim(),
      password: this.passEl.nativeElement.value,
      passwordConfirm: this.pass2El.nativeElement.value,
      agree: this.agreeEl.nativeElement.checked,
      accountType: this.accountTypeValue,
      businessName: this.accountTypeValue === 'proveedor'
        ? this.businessEl.nativeElement.value.trim()
        : undefined
    } as const;

    // 1) Registrar
    await this.auth.register(dto);

    // 2) Enviar email de bienvenida (no bloqueante)
    this.emailService.sendWelcome({
      toEmail: dto.email,
      toName: dto.name || 'Usuario',
      templateId: 6, // tu plantilla en Brevo
      params: {
        name: dto.name || 'Usuario',
        accountType: dto.accountType,
        businessName: dto.businessName || ''
      }
    }).subscribe({
      next: () => { /* opcional: métrica/telemetría */ },
      error: (err) => {
        console.warn('No se pudo enviar el email de bienvenida:', err);
        // opcional: this.errorMsg = 'Cuenta creada, pero falló el envío de correo.'
      }
    });

    // 3) Mensaje de éxito
    this.okMsg = this.accountTypeValue === 'proveedor'
      ? 'Cuenta creada. Tu perfil de proveedor está pendiente de aprobación.'
      : '¡Cuenta creada con éxito!';

    // (Opcional) cerrar modal aquí

  } catch (e: any) {
    this.errorMsg = e?.message || 'Error en el registro.';
  } finally {
    this.loading = false;
  }
}

}
