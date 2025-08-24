import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpertsSection } from './experts-section';

describe('ExpertsSection', () => {
  let component: ExpertsSection;
  let fixture: ComponentFixture<ExpertsSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpertsSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpertsSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
