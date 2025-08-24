import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProvidersSection } from './providers-section';

describe('ProvidersSection', () => {
  let component: ProvidersSection;
  let fixture: ComponentFixture<ProvidersSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProvidersSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProvidersSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
