import { Component,inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VirtualRouter } from '../../../../services/virtual-router';
import { ScriptLoaderService } from '../../../../services/script-loader.service';
import { AuthPocketbaseService } from '../../../../services/auth-pocketbase.service';

@Component({
  selector: 'app-header-component',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './header-component.html',
  styleUrls: ['./header-component.css']
})
export class HeaderComponent implements AfterViewInit {
  constructor(public virtualRouter: VirtualRouter,
    public scriptLoader: ScriptLoaderService,
    public auth: AuthPocketbaseService
  ) {}
  logout() {
    this.auth.logout();
    // opcional: regresar al home
    this.virtualRouter.navigate('home');
  }
  shouldHideProviderNotice(user: any): boolean {
    return user.role !== 'proveedor' || user.providerStatus === 'approved';
  }

  async ngAfterViewInit(): Promise<void> {
    await this.scriptLoader.loadMany(
      [
        // Núcleo
        // '/assets/js/jquery-3.7.1.min.js',
        // '/assets/js/bootstrap.bundle.min.js',
        // '/assets/plugins/moment/moment.js',
      
        // Plugins jQuery
        // '/assets/plugins/owlcarousel/owl.carousel.min.js',
        // '/assets/plugins/theia-sticky-sidebar/ResizeSensor.js',
        // '/assets/plugins/theia-sticky-sidebar/theia-sticky-sidebar.js',
      
        // RangeSlider (usa SOLO el .min)
        '/assets/plugins/ion-rangeslider/js/ion.rangeSlider.min.js',
        '/assets/plugins/ion-rangeslider/js/custom-rangeslider.js',
      
        // Datepicker (después de moment)
        '/assets/js/bootstrap-datetimepicker.min.js',
      
        // Waypoints antes de CounterUp
        '/assets/js/jquery.waypoints.min.js',
        '/assets/js/jquery.counterup.min.js',
      
        // Otros
        '/assets/js/jquery.meanmenu.min.js',
        '/assets/js/wow.min.js',
        '/assets/js/theme-script.js',
        '/assets/js/cursor.js',
      
        // Inicializaciones propias al final
        '/assets/js/script.js'
      ]
      
  );
  }
}
