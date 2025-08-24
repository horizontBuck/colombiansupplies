import { AfterViewInit, Component, NgZone, OnDestroy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScriptLoaderService } from '../../../services/script-loader.service';

// Import jQuery types
declare var $: any;
declare var jQuery: any;

declare global {
  interface Window {
    $: typeof $;
    jQuery: typeof jQuery;
    WOW: any; 
  }
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Add this to handle custom elements
})
export class HeroSection implements AfterViewInit, OnDestroy {
  private scriptLoader = inject(ScriptLoaderService);
  private ngZone = inject(NgZone);
  private scriptsReady = false;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.loadScripts();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private loadScripts(): void {
    this.ngZone.runOutsideAngular(() => {
      // All scripts are loaded globally in index.html
      // Just need to wait for DOM to be ready
      const checkReady = () => {
        if (window.jQuery) {
          this.scriptsReady = true;
          this.initializePlugins();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      
      // Start checking if scripts are ready
      checkReady();
    });
  }

  private initializePlugins(): void {
    this.ngZone.runOutsideAngular(() => {
      const $ = window.jQuery;
      
      try {
        // Initialize WOW.js
        if (window.WOW) {
          new window.WOW({
            boxClass: 'wow',
            animateClass: 'animated',
            offset: 20,
            mobile: true,
            live: true
          }).init();
        }

        // Initialize datepickers
        if ($.fn.datetimepicker) {
          $('.datetimepicker').each((index: number, element: HTMLElement) => {
            $(element).datetimepicker({
              format: 'DD/MM/YYYY',
              minDate: new Date(),
              icons: {
                previous: 'ti-arrow-left',
                next: 'ti-arrow-right'
              },
              allowInputToggle: true,
              showTodayButton: true,
              showClear: true,
              showClose: true
            });
          });
          console.log('Datepickers initialized on', $('.datetimepicker').length, 'elements');
        } else {
          console.warn('Bootstrap datetimepicker not loaded');
        }

        // Initialize tooltips
        if ($.fn.tooltip) {
          $('[data-bs-toggle="tooltip"]').tooltip();
        }

        // Initialize counter up
        if ($.fn.counterUp && $.fn.waypoint) {
          $('.counter').counterUp({
            delay: 10,
            time: 1000
          });
        }

        console.log('All plugins initialized');
      } catch (error) {
        console.error('Error initializing plugins:', error);
      }
    });
  }
}
