import { Component, AfterViewInit, inject } from '@angular/core';
import { ScriptLoaderService } from '../../../services/script-loader.service';
import { RecentlyAdded } from '../../dashboard-sections/recently-added/recently-added';
import { CommonModule } from '@angular/common';
import { RecentInvoices } from "../../dashboard-sections/recent-invoices/recent-invoices";
import { RecentOrders } from '../../dashboard-sections/recent-orders/recent-orders';

declare const bootstrap: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RecentlyAdded,
    RecentInvoices,
    RecentOrders,
],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements AfterViewInit {
  private scriptLoader = inject(ScriptLoaderService);

  async ngAfterViewInit(): Promise<void> {
    try {
      // 1) Base: jQuery -> Bootstrap (orden seguro para el resto)
      await this.scriptLoader.loadManySequential([
        'assets/js/jquery-3.7.1.min.js',
        'assets/js/bootstrap.bundle.min.js'
      ]);

      // 2) Inicialización Bootstrap (primer pase)
      this.initBootstrapDropdowns();
      this.initBootstrapTooltips();

      // 3) Submenu tipo "subdrop" SIN jQuery, solo en headers del submenu
      this.wireSubdropHeaders();

      // 4) Resto de librerías (charts y utilidades)
      await this.scriptLoader.loadManySequential([
        'assets/plugins/slick/slick.min.js',
        'assets/plugins/apexchart/apexcharts.min.js',
        'assets/plugins/apexchart/chart-data.js', // si lo usas
        'assets/plugins/theia-sticky-sidebar/ResizeSensor.js',
        'assets/plugins/theia-sticky-sidebar/theia-sticky-sidebar.js'
        // 'assets/js/script.js', // si lo activas, desactiva su handler de sidebar o limita su selector
      ]);

      // 5) Re-bind por si algún script re-pintó nodos
      this.initBootstrapDropdowns();
      this.initBootstrapTooltips();

      // 6) Charts init (si chart-data.js expone una función)
      (window as any).initDashboardCharts?.();

      console.log('Dashboard cargado ✅');
    } catch (err) {
      console.error('Error en Dashboard:', err);
    }
  }

  // --------- Helpers ---------

  /** Instancia explícitamente los dropdowns y añade un click handler robusto */
  private initBootstrapDropdowns() {
    const Bootstrap = (window as any).bootstrap;
    if (!Bootstrap) return;

    // Instanciar todos los toggles presentes
    document
      .querySelectorAll<HTMLElement>('[data-bs-toggle="dropdown"]')
      .forEach((el) => {
        Bootstrap.Dropdown.getOrCreateInstance(el);
      });

    // Safety net: toggle manual en click, idempotente
    document.querySelectorAll<HTMLElement>('.dropdown-toggle').forEach((el) => {
      el.removeEventListener('click', this.dropdownClickHandler as EventListener);
      el.addEventListener('click', this.dropdownClickHandler as EventListener);
    });
  }

  private dropdownClickHandler = (ev: MouseEvent) => {
    const target = ev.currentTarget as HTMLElement;
    if (target.tagName === 'A') ev.preventDefault();
    ev.stopPropagation();
    const Bootstrap = (window as any).bootstrap;
    const inst = Bootstrap?.Dropdown?.getOrCreateInstance(target);
    inst?.toggle();
  };

  /** Tooltips explícitos */
  private initBootstrapTooltips() {
    const Bootstrap = (window as any).bootstrap;
    if (!Bootstrap) return;
    document
      .querySelectorAll<HTMLElement>('[data-bs-toggle="tooltip"]')
      .forEach((el) => {
        Bootstrap.Tooltip.getOrCreateInstance(el);
      });
  }

  /** Lógica del submenú tipo "subdrop" SIN jQuery y bien acotada */
  private wireSubdropHeaders() {
    const headers = Array.from(
      document.querySelectorAll<HTMLElement>('.user-sidebar li.submenu > a')
    );
    headers.forEach((header) => {
      header.removeEventListener('click', this.subdropHandler as EventListener);
      header.addEventListener('click', this.subdropHandler as EventListener);
    });
  }

  private subdropHandler = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // no interfiere con otros dropdowns

    const trigger = e.currentTarget as HTMLElement;
    const submenu = trigger.nextElementSibling as HTMLElement | null;
    const isOpen = trigger.classList.contains('subdrop');

    const headers = Array.from(
      document.querySelectorAll<HTMLElement>('.user-sidebar li.submenu > a')
    );

    // Cerrar los demás
    headers.forEach((h) => {
      if (h !== trigger) {
        h.classList.remove('subdrop');
        const other = h.nextElementSibling as HTMLElement | null;
        if (other) other.style.display = 'none';
      }
    });

    // Toggle actual
    if (!isOpen) {
      trigger.classList.add('subdrop');
      if (submenu) submenu.style.display = 'block';
    } else {
      trigger.classList.remove('subdrop');
      if (submenu) submenu.style.display = 'none';
    }
  };
}
