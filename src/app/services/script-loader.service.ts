import { Injectable, NgZone } from '@angular/core';

type LoadState = 'pending' | 'loaded' | 'error';

@Injectable({ providedIn: 'root' })
export class ScriptLoaderService {
  private scripts = new Map<string, { state: LoadState; promise: Promise<void> }>();
  private styles = new Map<string, { state: LoadState; promise: Promise<void> }>();

  constructor(private zone: NgZone) {}
  loadManySequential(scripts: string[] = [], styles: string[] = []): Promise<void> {
    // 1) Cargar CSS en paralelo
    const stylesP = Promise.all(styles.map(href => this.loadStyle(href)));
  
    // 2) Encadenar scripts en ORDEN
    const chain = (urls: string[]) =>
      urls.reduce((p, url) => p.then(() => this.loadScript(url, { defer: 'true' })), Promise.resolve());
  
    return stylesP.then(() => chain(scripts)).then(() => undefined);
  }
  
  loadScript(src: string, attrs: Record<string, string> = {}): Promise<void> {
    const key = src;
    const cached = this.scripts.get(key);
    if (cached) return cached.promise;

    const p = new Promise<void>((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));

      el.onload = () => resolve();
      el.onerror = () => reject(new Error(`Error cargando script: ${src}`));

      // Evita disparar CD innecesario
      this.zone.runOutsideAngular(() => document.body.appendChild(el));
    });

    this.scripts.set(key, { state: 'pending', promise: p });
    p.then(() => this.scripts.set(key, { state: 'loaded', promise: p }))
     .catch(() => this.scripts.set(key, { state: 'error', promise: p }));

    return p;
  }

  loadStyle(href: string): Promise<void> {
    const key = href;
    const cached = this.styles.get(key);
    if (cached) return cached.promise;

    const p = new Promise<void>((resolve, reject) => {
      const el = document.createElement('link');
      el.rel = 'stylesheet';
      el.href = href;

      el.onload = () => resolve();
      el.onerror = () => reject(new Error(`Error cargando stylesheet: ${href}`));

      this.zone.runOutsideAngular(() =>
        document.head.appendChild(el)
      );
    });

    this.styles.set(key, { state: 'pending', promise: p });
    p.then(() => this.styles.set(key, { state: 'loaded', promise: p }))
     .catch(() => this.styles.set(key, { state: 'error', promise: p }));

    return p;
  }

  loadMany(scripts: string[] = [], styles: string[] = []): Promise<void> {
    const ps: Promise<void>[] = [];
    styles.forEach(href => ps.push(this.loadStyle(href)));
    scripts.forEach(src => ps.push(this.loadScript(src)));
    return Promise.all(ps).then(() => undefined);
  }
}
