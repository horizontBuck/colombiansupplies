import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScriptLoaderService } from '../../../services/script-loader.service';
import { VirtualRouter } from '../../../services/virtual-router';

declare const $: any;

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail.html',
  styleUrls: ['./detail.css']
})
export class Detail implements AfterViewInit, OnDestroy {
  private initialized = false;

  constructor(
    public scriptLoader: ScriptLoaderService,
    public virtualRouter: VirtualRouter
  ) {}

  // ---- utils ---------------------------------------------------------------
  private waitFor<T>(test: () => T | undefined | null, timeoutMs = 8000, intervalMs = 50): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const start = Date.now();
      const id = setInterval(() => {
        try {
          const v = test();
          if (v !== undefined && v !== null) {
            clearInterval(id);
            resolve(v as T);
          } else if (Date.now() - start > timeoutMs) {
            clearInterval(id);
            reject(new Error('waitFor timeout'));
          }
        } catch { /* sigue */ }
      }, intervalMs);
    });
  }

  // ---- lifecycle -----------------------------------------------------------
  async ngAfterViewInit(): Promise<void> {
    // 1) CSS primero (si no los tienes en angular.json)
    await Promise.all([
      this.scriptLoader.loadStyle('assets/plugins/slick/slick.css'),
      this.scriptLoader.loadStyle('assets/plugins/slick/slick-theme.css'),
      this.scriptLoader.loadStyle('assets/plugins/owlcarousel/owl.carousel.min.css'),
      this.scriptLoader.loadStyle('assets/plugins/fancybox/jquery.fancybox.min.css')
    ]).catch(() => { /* ignora si ya están en angular.json */ });

    // 2) Scripts en ORDEN (evita race conditions)
    await this.scriptLoader.loadScript('assets/js/jquery-3.7.1.min.js');
    await this.scriptLoader.loadScript('assets/js/bootstrap.bundle.min.js');

    await this.scriptLoader.loadScript('assets/plugins/slick/slick.min.js');
    await this.scriptLoader.loadScript('assets/plugins/owlcarousel/owl.carousel.min.js');
    await this.scriptLoader.loadScript('assets/plugins/fancybox/jquery.fancybox.min.js');
    await this.scriptLoader.loadScript('assets/plugins/theia-sticky-sidebar/ResizeSensor.js');
    await this.scriptLoader.loadScript('assets/plugins/theia-sticky-sidebar/theia-sticky-sidebar.js');
    await this.scriptLoader.loadScript('assets/js/bootstrap-datetimepicker.min.js').catch(() => {});

    // Opcional Cloudflare email decode (suele ir desde raíz)
    await this.scriptLoader.loadScript('/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js').catch(() => {});

    // Tu script final (si depende de lo anterior, déjalo al final)
    await this.scriptLoader.loadScript('assets/js/script.js').catch(() => {});

    // 3) Esperar globals antes de inicializar
    const jq = await this.waitFor(() => (window as any).jQuery);
    await this.waitFor(() => (jq.fn && jq.fn.slick));
    await this.waitFor(() => (jq.fn && jq.fn.owlCarousel));
    // fancybox + theia opcionales
    // await this.waitFor(() => (jq.fancybox));

    // 4) Inits (idempotentes)
    this.initSlick();
    this.initOwl();
    this.initFancybox();
    this.initSticky();
    this.initDatePicker();
    this.bindQuantityButtons();
    this.bindReadMore();

    this.initialized = true;
  }

  ngOnDestroy(): void {
    if (!this.initialized || typeof $ !== 'function') return;

    try {
      if ($('#large-img').hasClass('slick-initialized')) $('#large-img').slick('unslick');
      if ($('#small-img').hasClass('slick-initialized')) $('#small-img').slick('unslick');
      if ($('.tour-gallery-slider').data('owl.carousel')) {
        $('.tour-gallery-slider').trigger('destroy.owl.carousel');
      }
    } catch (e) { console.warn(e); }

    // quitar handlers con namespace para no duplicar al volver
    $(document).off('.detail');
  }

  // ---- inits ---------------------------------------------------------------
  private initSlick() {
    if ($('#large-img').length && typeof $('#large-img').slick === 'function') {
      $('#large-img').not('.slick-initialized').slick({
        slidesToShow: 1,
        asNavFor: '#small-img',
        adaptiveHeight: true,
        arrows: true,
        prevArrow: '<button type="button" class="slick-prev" aria-label="Previous"></button>',
        nextArrow: '<button type="button" class="slick-next" aria-label="Next"></button>'
      });
    }

    if ($('#small-img').length && typeof $('#small-img').slick === 'function') {
      $('#small-img').not('.slick-initialized').slick({
        slidesToShow: 5,
        asNavFor: '#large-img',
        focusOnSelect: true,
        vertical: true,
        arrows: true,
        prevArrow: '<button type="button" class="slick-prev" aria-label="Previous"></button>',
        nextArrow: '<button type="button" class="slick-next" aria-label="Next"></button>',
        responsive: [
          { breakpoint: 1200, settings: { vertical: false, slidesToShow: 4 } },
          { breakpoint: 576,  settings: { vertical: false, slidesToShow: 3 } }
        ]
      });
    }
  }

  private initOwl() {
    const $slider = $('.tour-gallery-slider');
    if ($slider.length && typeof $slider.owlCarousel === 'function' && !$slider.hasClass('owl-loaded')) {
      $slider.owlCarousel({
        items: 4,
        margin: 16,
        loop: true,
        nav: true,
        dots: false,
        responsive: {
          0: { items: 2 },
          768: { items: 3 },
          1200: { items: 4 }
        }
      });
    }
  }

  private initFancybox() {
    if ($.fancybox) $('[data-fancybox="gallery"]').fancybox();
  }

  private initSticky() {
    if ($('.theiaStickySidebar').length && typeof ($('.theiaStickySidebar') as any).theiaStickySidebar === 'function') {
      ($('.theiaStickySidebar') as any).theiaStickySidebar({ additionalMarginTop: 100 });
    }
  }

  private initDatePicker() {
    if ($('.datetimepicker').length && typeof ($('.datetimepicker') as any).datetimepicker === 'function') {
      ($('.datetimepicker') as any).datetimepicker({ format: 'DD-MM-YYYY' });
    }
  }

  // ---- handlers ------------------------------------------------------------
  private bindQuantityButtons() {
    // Usa namespace .detail para limpiar fácil en destroy
    $(document).off('click.detail', '.quantity-right-plus');
    $(document).off('click.detail', '.quantity-left-minus');

    $(document).on('click.detail', '.quantity-right-plus', function () {
      const $input = $().closest('.input-group').find('.input-number');
      const val = parseInt(($input.val() as string) || '0', 10) || 0;
      $input.val(String(val + 1).padStart(2, '0'));
    });

    $(document).on('click.detail', '.quantity-left-minus', function () {
      const $input = $().closest('.input-group').find('.input-number');
      const val = parseInt(($input.val() as string) || '0', 10) || 0;
      $input.val(String(Math.max(0, val - 1)).padStart(2, '0'));
    });
  }

  private bindReadMore() {
    $(document).off('click.detail', '.more-link');
    $(document).on('click.detail', '.more-link', function () {
      $().closest('.read-more').toggleClass('open');
    });
  }
}
