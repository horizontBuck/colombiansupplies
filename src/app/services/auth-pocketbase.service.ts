import { Injectable } from '@angular/core';
import PocketBase, { RecordModel } from 'pocketbase';

const PB_URL = 'https://db.colombiatoursyexperiencias.online:8559';

export type Role = 'cliente' | 'proveedor' | 'admin';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  agree: boolean;
  accountType: 'cliente' | 'proveedor';
  businessName?: string; // requerido si proveedor
}

@Injectable({ providedIn: 'root' })
export class AuthPocketbaseService {
  private pb = new PocketBase(PB_URL);

  // Claves de almacenamiento
  private STORAGE_KEY = 'pb_auth_cookie';
  private REMEMBER_KEY = 'pb_remember'; // '1' | '0'

  constructor() {
    // Restaurar sesión desde localStorage o sessionStorage
    const saved =
      localStorage.getItem(this.STORAGE_KEY) ??
      sessionStorage.getItem(this.STORAGE_KEY) ??
      '';
    if (saved) this.pb.authStore.loadFromCookie(saved);

    // Persistir el token según preferencia "Recordarme"
    this.pb.authStore.onChange(() => {
      const cookie = this.pb.authStore.exportToCookie();
      const remember = (localStorage.getItem(this.REMEMBER_KEY) ?? '1') === '1';
      if (remember) {
        localStorage.setItem(this.STORAGE_KEY, cookie);
        sessionStorage.removeItem(this.STORAGE_KEY);
      } else {
        sessionStorage.setItem(this.STORAGE_KEY, cookie);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    });
  }

  /** ¿Hay sesión válida? */
  get isLoggedIn(): boolean {
    return this.pb.authStore.isValid;
  }

  /** Usuario autenticado (o null) */
  get currentUser(): RecordModel | null {
    return this.pb.authStore.model;
  }

  /** Cerrar sesión y limpiar almacenamiento */
  logout(): void {
    this.pb.authStore.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  /** Iniciar sesión */
  async login(email: string, password: string, remember = true): Promise<RecordModel> {
    try {
      const auth = await this.pb.collection('users').authWithPassword(email, password);

      // Guardar preferencia y cookie
      localStorage.setItem(this.REMEMBER_KEY, remember ? '1' : '0');
      const cookie = this.pb.authStore.exportToCookie();

      if (remember) {
        localStorage.setItem(this.STORAGE_KEY, cookie);
        sessionStorage.removeItem(this.STORAGE_KEY);
      } else {
        sessionStorage.setItem(this.STORAGE_KEY, cookie);
        localStorage.removeItem(this.STORAGE_KEY);
      }

      return auth.record as RecordModel;
    } catch (err) {
      throw this.mapPocketbaseError(err);
    }
  }

  /** Registrar cliente o proveedor */
  async register(dto: RegisterDto): Promise<RecordModel> {
    if (!dto.agree) throw new Error('Debes aceptar los Términos y Condiciones.');
    if (dto.password !== dto.passwordConfirm) throw new Error('Las contraseñas no coinciden.');
    if (dto.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');

    const role: Role = dto.accountType === 'proveedor' ? 'proveedor' : 'cliente';
    if (role === 'proveedor' && !dto.businessName) {
      throw new Error('Para registrarte como proveedor, ingresa el nombre comercial.');
    }

    const username = this.buildUsername(dto.email, dto.name);

    // Enviar providerStatus='pending' cuando sea proveedor (fail-safe)
    const payload: any = {
      username,
      name: dto.name,
      email: dto.email,
      emailVisibility: true,
      password: dto.password,
      passwordConfirm: dto.passwordConfirm,
      role,
      termsAccepted: true,
    };
    if (role === 'proveedor') {
      payload.providerStatus = 'pending';
      if (dto.businessName) payload.businessName = dto.businessName;
    }

    try {
      const record = await this.pb.collection('users').create(payload);

      // Si en PB “Only verified users can auth” = ON, comenta el auto-login:
      await this.pb.collection('users').authWithPassword(dto.email, dto.password);

      return record as RecordModel;
    } catch (err) {
      throw this.mapPocketbaseError(err);
    }
  }

  /** Helper: construir username legible y único */
  private buildUsername(email: string, name: string): string {
    const base = (name || email.split('@')[0] || 'user')
      .toLowerCase()
      .normalize('NFD')
      // eliminar diacríticos (seguro en todos los runtimes)
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 16);
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base || 'user'}_${suffix}`;
  }

  /** Normaliza errores de PB a mensajes claros (sin choques con TS) */
  private mapPocketbaseError(err: unknown): Error {
    const e = err as any;

    const payload = (e?.data ?? e?.response ?? {}) as {
      code?: number;
      message?: string;
      data?: Record<string, { code?: string; message?: string }>;
    };

    const status: number = e?.status ?? 0;
    const message: string = e?.message ?? payload?.message ?? 'Error';
    const fields = (payload.data ?? {}) as Record<string, { code?: string; message?: string }>;

    // Errores de validación (400)
    if (status === 400) {
      if (fields['email']?.code === 'validation_invalid_email') return new Error('El email no es válido.');
      if (fields['email']?.code === 'validation_value_already_in_use') return new Error('Este email ya está registrado.');
      if (fields['username']?.code === 'validation_value_already_in_use') return new Error('El username ya está en uso.');
      if (fields['password']?.code) return new Error('La contraseña no cumple los requisitos.');
      if (fields['role']?.code) return new Error('Rol no permitido.');
    }

    // Mensajes comunes de auth
    const lower = (message || '').toLowerCase();
    if (lower.includes('failed to authenticate')) {
      return new Error('Credenciales inválidas o usuario no verificado.');
    }

    return new Error(message || 'No se pudo completar la operación.');
  }
}
