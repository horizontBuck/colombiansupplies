// src/app/services/categories-realtime.service.ts
import { Injectable, Inject, NgZone, OnDestroy } from '@angular/core';
import PocketBase, { RecordModel, ListResult } from 'pocketbase';
import { Observable, shareReplay } from 'rxjs';
import { PB_URL } from '../core/pb.tokens';

export interface Category extends RecordModel {
  name: string;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
  image?: string;
  description?: string;
}

export type CategoryAction = 'create' | 'update' | 'delete';
export interface CategoryEvent {
  action: CategoryAction;
  record: Category;
  collection: 'categories';
}
type Topic = '*' | string;

@Injectable({ providedIn: 'root' })
export class CategoriesRealtimeService implements OnDestroy {
  private readonly collection = 'categories' as const;
  private readonly pb: PocketBase;
  private streams = new Map<string, Observable<CategoryEvent>>();

  constructor(@Inject(PB_URL) baseUrl: string, private readonly zone: NgZone) {
    this.pb = new PocketBase(baseUrl);
    this.pb.autoCancellation(false);
  }

  // --------- Listas ----------
  async listFeatured(): Promise<Category[]> {
    const res: ListResult<Category> = await this.pb
      .collection(this.collection)
      .getList<Category>(1, 8, {
        filter: 'is_featured = true && is_active = true',
        sort: 'sort_order,name',
        skipTotal: true
      });
    return res.items;
  }

  // --------- Realtime ----------
  /** Más confiable: suscribe a TODA la colección y filtra en el cliente */
  watchAll(): Observable<CategoryEvent> {
    return this.watchTopic('*');
  }

  watchById(id: string): Observable<CategoryEvent> {
    return this.watchTopic(id);
  }

  private watchTopic(topic: Topic): Observable<CategoryEvent> {
    const key = `${this.collection}|${topic}`;
    const cached = this.streams.get(key);
    if (cached) return cached;

    const stream$ = new Observable<CategoryEvent>((subscriber) => {
      this.zone.runOutsideAngular(async () => {
        try {
          await this.pb.collection(this.collection).subscribe(
            topic,
            (e: any) => {
              const evt: CategoryEvent = {
                action: e.action as CategoryAction,
                record: e.record as Category,
                collection: this.collection
              };
              this.zone.run(() => subscriber.next(evt));
            }
          );
        } catch (err) {
          this.zone.run(() => subscriber.error(err));
        }
      });
      return () => {
        this.pb.collection(this.collection).unsubscribe(topic).catch(() => {});
      };
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

    this.streams.set(key, stream$);
    return stream$;
  }

  ngOnDestroy(): void {
    for (const key of this.streams.keys()) {
      const [, topic] = key.split('|');
      this.pb.collection(this.collection).unsubscribe(topic as Topic).catch(() => {});
    }
    this.streams.clear();
  }
}
