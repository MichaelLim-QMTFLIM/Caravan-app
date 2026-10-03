import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderhistoryPage } from './orderhistory.page';

describe('OrderhistoryPage', () => {
  let component: OrderhistoryPage;
  let fixture: ComponentFixture<OrderhistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderhistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
