import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScriptLoaderService } from '../../../services/script-loader.service';

@Component({
  selector: 'app-all',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all.html',
  styleUrls: ['./all.css'],
  providers: [ScriptLoaderService]
})
export class All implements AfterViewInit {
  private scriptLoader = inject(ScriptLoaderService);

  async ngAfterViewInit(): Promise<void> {
    await this.scriptLoader.loadMany([
      '/assets/plugins/owlcarousel/owl.carousel.min.js',
      '/assets/plugins/theia-sticky-sidebar/ResizeSensor.js',
      '/assets/plugins/theia-sticky-sidebar/theia-sticky-sidebar.js',
      '/assets/plugins/datetimepicker/js/bootstrap-datetimepicker.min.js',
      '/assets/plugins/ion-rangeslider/js/ion.rangeSlider.js',
      '/assets/plugins/ion-rangeslider/js/custom-rangeslider.js',
      '/assets/plugins/ion-rangeslider/js/ion.rangeSlider.min.js',
      '/assets/js/script.js'
    ]);
  }
}
