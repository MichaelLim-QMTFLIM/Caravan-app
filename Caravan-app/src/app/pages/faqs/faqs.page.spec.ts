import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FAQsPage } from './faqs.page';

describe('FAQsPage', () => {
  let component: FAQsPage;
  let fixture: ComponentFixture<FAQsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FAQsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
