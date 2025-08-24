import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogSection } from './blog-section';

describe('BlogSection', () => {
  let component: BlogSection;
  let fixture: ComponentFixture<BlogSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
