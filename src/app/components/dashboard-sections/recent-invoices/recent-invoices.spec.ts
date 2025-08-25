import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentInvoices } from './recent-invoices';

describe('RecentInvoices', () => {
  let component: RecentInvoices;
  let fixture: ComponentFixture<RecentInvoices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentInvoices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentInvoices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
