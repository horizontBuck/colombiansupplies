import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaceSection } from './place-section';

describe('PlaceSection', () => {
  let component: PlaceSection;
  let fixture: ComponentFixture<PlaceSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaceSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
