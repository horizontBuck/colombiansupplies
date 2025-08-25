import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentlyAdded } from './recently-added';

describe('RecentlyAdded', () => {
  let component: RecentlyAdded;
  let fixture: ComponentFixture<RecentlyAdded>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentlyAdded]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentlyAdded);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
