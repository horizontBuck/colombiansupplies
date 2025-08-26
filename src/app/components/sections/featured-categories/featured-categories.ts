// src/app/components/featured-categories/featured-categories.ts
import {
  AfterViewInit, ChangeDetectionStrategy, Component, NgZone, OnDestroy,
  ViewChild, ElementRef, ViewEncapsulation, computed, effect, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ScriptLoaderService } from '../../../services/script-loader.service';
import { CategoriesRealtimeService, Category, CategoryEvent } from '../../../services/categories-realtime.service';

declare global { interface Window { $: any; jQuery: any; } }

@Component({
  selector: 'app-featured-categories',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './featured-categories.html',
  styleUrls: ['./featured-categories.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FeaturedCategories implements AfterViewInit, OnDestroy {
  @ViewChild('carousel', { static: false }) carouselRef?: ElementRef<HTMLElement>;

  // estado
  readonly categories = signal<Category[]>([]);
  readonly filteredCategories = computed(() =>
    this.categories()
      .filter(c => c?.is_active !== false && c?.is_featured !== false)
      .sort((a: any, b: any) => {
        const ao = typeof a.sort_order === 'number' ? a.sort_order : Number.MAX_SAFE_INTEGER;
        const bo = typeof b.sort_order === 'number' ? b.sort_order : Number.MAX_SAFE_INTEGER;
        return ao !== bo ? ao - bo : (a.name || '').localeCompare(b.name || '');
      })
      .slice(0, 8)
  );

  // control render
  readonly showCarousel = signal(true);
  private scriptsReady = false;
  private viewReady = false;

  private prevSignature = '';
  private rerenderTimer: any = null;
  private initialized = false;

  constructor(
    private readonly scriptLoader: ScriptLoaderService,
    private readonly ngZone: NgZone,
    private readonly categoriesRealtimeService: CategoriesRealtimeService
  ) {
    // 1) Carga inicial (8 featured)
    this.categoriesRealtimeService.listFeatured()
      .then(items => this.categories.set(items))
      .catch(console.error);

    // 2) Realtime: escuchamos todo y filtramos en cliente
    this.categoriesRealtimeService.watchAll()
      .pipe(takeUntilDestroyed())
      .subscribe((e: CategoryEvent) => {
        const list = this.categories();

        if (e.action === 'create') {
          const next = [e.record, ...list];
          this.categories.set(this.uniqueById(next));
        } else if (e.action === 'update') {
          const next = list.map(x => x.id === e.record.id ? e.record : x);
          // si antes no estaba en memoria (p.ej. pasó a featured) lo añadimos
          if (!next.find(x => x.id === e.record.id)) next.unshift(e.record);
          this.categories.set(this.uniqueById(next));
        } else if (e.action === 'delete') {
          this.categories.set(list.filter(x => x.id !== e.record.id));
        }
      });

    // 3) Orquestación: solo (re)iniciar cuando TODO esté listo y haya ítems
    effect(() => {
      const items = this.filteredCategories();
      const ready = this.scriptsReady && this.viewReady;
      const signature = items.map(c => `${c.id}:${(c as any).updated ?? ''}:${(c as any).sort_order ?? ''}`).join('|');

      if (!ready) return;

      if (items.length === 0) {
        this.destroyCarousel();
        this.prevSignature = signature;
        return;
      }

      if (signature !== this.prevSignature) {
        clearTimeout(this.rerenderTimer);
        // pequeño debounce para agrupar ráfagas del realtime
        this.rerenderTimer = setTimeout(() => this.hardRerenderCarousel(), 120);
        this.prevSignature = signature;
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    await this.scriptLoader.loadMany([
      '/assets/js/jquery-3.7.1.min.js',
      '/assets/plugins/owlcarousel/owl.carousel.min.js'
    ], []);

    const jq = (window as any).jQuery || (window as any).$;
    if (jq) { window.$ = window.jQuery = jq; }

    this.scriptsReady = true;
    // marca vista lista tras el siguiente ciclo (asegura que *ngFor pintó)
    queueMicrotask(() => {
      this.viewReady = true;
      if (this.filteredCategories().length > 0) {
        this.initOrRefreshCarousel();
      }
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.rerenderTimer);
    this.destroyCarousel();
  }

  trackById(_: number, c: Category) { return c.id; }

  // ----- privados -----
  private uniqueById(arr: Category[]) {
    const map = new Map<string, Category>();
    for (const c of arr) map.set(c.id, c);
    return Array.from(map.values());
  }

  private hardRerenderCarousel(): void {
    this.destroyCarousel();
    this.showCarousel.set(false);
    queueMicrotask(() => {
      this.showCarousel.set(true);
      requestAnimationFrame(() => this.initOrRefreshCarousel());
    });
  }

  private initOrRefreshCarousel(): void {
    const $ = window.$ || window.jQuery;
    const el = this.carouselRef?.nativeElement;
    if (!$ || !el) return;

    this.ngZone.runOutsideAngular(() => {
      const $carousel = $(el);

      // evita inicializar sobre un contenedor sin hijos
      if (!$carousel.children().length) return;

      if (!$carousel.hasClass('owl-loaded')) {
        $carousel.owlCarousel({
          items: 4,
          margin: 16,
          loop: false,
          nav: true,
          dots: true,
          responsive: {
            0: { items: 1 },
            576: { items: 2 },
            992: { items: 3 },
            1200: { items: 5 }
          }
        });
        this.initialized = true;
        console.log('[Owl] initialized');
      } else {
        $carousel.trigger('refresh.owl.carousel');
        console.log('[Owl] refreshed');
      }

      if ($ && $.fancybox) { $('[data-fancybox]').fancybox(); }
    });
  }

  private destroyCarousel(): void {
    try {
      const $ = window.$ || window.jQuery;
      const el = this.carouselRef?.nativeElement;
      if ($ && el) {
        const $carousel = $(el);
        if ($carousel.hasClass('owl-loaded')) {
          $carousel.trigger('destroy.owl.carousel');
          console.log('[Owl] destroyed');
        }
      }
      this.initialized = false;
    } catch {}
  }
}
