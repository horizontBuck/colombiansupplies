import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthPocketbaseService } from '../../../services/auth-pocketbase.service';
import { EmailService } from '../../../services/email.service';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-modal.html',
  styleUrls: ['./register-modal.css']
})
export class RegisterModal {
  // Pasos: 1=Tipo, 2=Datos, 3=Términos
  currentStep: 1 | 2 | 3 = 1;

  // Tipo seleccionado (coincide con tu backend)
  selectedAccountType: 'cliente' | 'proveedor' = 'cliente';

  loading = false;
  errorMsg = '';
  okMsg = '';

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthPocketbaseService,
    public emailService: EmailService
  ) {
    this.form = this.fb.group({
      // Paso 1
      accountType: ['cliente', Validators.required],

      // Paso 2
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      companyName: [''], // se valida dinámicamente cuando es proveedor

      // Paso 3
      agree: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  /** Validador: password === confirmPassword */
  private passwordMatchValidator(group: FormGroup) {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    return p && c && p !== c ? { passwordMismatch: true } : null;
  }

  /** Selección por imágenes */
  setAccountType(type: 'cliente' | 'proveedor') {
    this.selectedAccountType = type;
    this.form.get('accountType')!.setValue(type);
    this.applyCompanyValidators(); // aplica/limpia validadores en caliente
  }

  /** Hace obligatorio companyName solo si es proveedor */
  private applyCompanyValidators() {
    const company = this.form.get('companyName')!;
    if (this.selectedAccountType === 'proveedor') {
      company.addValidators([Validators.required, Validators.minLength(2)]);
    } else {
      company.clearValidators();
      company.setValue('');
    }
    company.updateValueAndValidity();
  }

  /** Avanzar de paso con validación */
  next() {
    if (!this.isStepValid()) { this.touchStepControls(); return; }
    if (this.currentStep === 1) {
      this.applyCompanyValidators();
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      this.currentStep = 3;
    }
  }

  back() {
    if (this.currentStep === 3) this.currentStep = 2;
    else if (this.currentStep === 2) this.currentStep = 1;
  }

  /** Validez por paso */
  isStepValid(): boolean {
    if (this.currentStep === 1) {
      return this.form.get('accountType')!.valid;
    }
    if (this.currentStep === 2) {
      const base = ['name', 'email', 'password', 'confirmPassword'];
      if (this.selectedAccountType === 'proveedor') base.push('companyName');
      return base.every(c => this.form.get(c)!.valid) && !this.form.errors?.['passwordMismatch'];
    }
    return this.form.get('agree')!.valid; // paso 3
  }

  /** Marca controles del paso para mostrar errores */
  private touchStepControls() {
    const m1 = ['accountType'];
    const m2 = ['name', 'email', 'password', 'confirmPassword'];
    if (this.selectedAccountType === 'proveedor') m2.push('companyName');
    const m3 = ['agree'];
    const map = { 1: m1, 2: m2, 3: m3 } as const;
    map[this.currentStep].forEach(c => this.form.get(c)?.markAsTouched());
  }

  /** Envío final */
  async submit() {
    if (!this.isStepValid()) { this.touchStepControls(); return; }

    this.loading = true; this.errorMsg = ''; this.okMsg = '';
    try {
      const dto = {
        name: this.form.value.name.trim(),
        email: this.form.value.email.trim(),
        password: this.form.value.password,
        passwordConfirm: this.form.value.confirmPassword,
        agree: this.form.value.agree,
        accountType: this.form.value.accountType as 'cliente' | 'proveedor',
        businessName: this.selectedAccountType === 'proveedor'
          ? (this.form.value.companyName || '').trim()
          : undefined
      } as const;

      // 1) Registro en tu backend
      await this.auth.register(dto);

      // 2) Email de bienvenida (no bloqueante)
      /* this.emailService.sendWelcome({
        toEmail: dto.email,
        toName: dto.name || 'Usuario',
        templateId: 8,
        params: { name: dto.name || 'Usuario', accountType: dto.accountType, businessName: dto.businessName || '' }
      }).subscribe({ error: (err) => console.warn('Email bienvenida falló:', err) });
       */await firstValueFrom(this.emailService.sendWelcome({
        toEmail: dto.email,
        toName: dto.name || 'Usuario',
        templateId: 8,
        params: { name: dto.name || 'Usuario', accountType: dto.accountType, businessName: dto.businessName || '' }
      }));
      // 3) OK UX
      this.okMsg = this.selectedAccountType === 'proveedor'
        ? 'Cuenta creada. Tu perfil de proveedor está pendiente de aprobación.'
        : '¡Cuenta creada con éxito!';
    } catch (e: any) {
      this.errorMsg = e?.message || 'Error en el registro.';
    } finally {
      this.loading = false;
    }
  }
}
