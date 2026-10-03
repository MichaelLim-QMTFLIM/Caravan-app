import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('data', () => {
    it('should have 4 features with icons, titles and text', () => {
      expect(component.features.length).toBe(4);
      component.features.forEach(f => {
        expect(f.icon).toContain('assets/Images/');
        expect(f.title).toBeTruthy();
        expect(f.text).toBeTruthy();
      });
    });

    it('should have the 5 categories with matching image paths', () => {
      expect(component.categories.map(c => c.name)).toEqual([
        'Baking', 'Drinking', 'Cooking', 'Garnishing', 'Medicinal',
      ]);
      component.categories.forEach(c => {
        expect(c.image).toBe(`assets/Images/${c.name}.jpg`);
      });
    });

    it('should start with empty product lists', () => {
      expect(component.newArrivals).toEqual([]);
      expect(component.popularProducts).toEqual([]);
    });
  });

  describe('template', () => {
    it('should render the welcome heading', () => {
      expect(el.querySelector('.welcome')?.textContent).toContain('Welcome to Caravan');
    });

    it('should render one feature item per feature', () => {
      expect(el.querySelectorAll('.feature-item').length).toBe(component.features.length);
    });

    it('should render one category per category entry', () => {
      expect(el.querySelectorAll('.category').length).toBe(component.categories.length);
    });

    it('should render category names', () => {
      const names = Array.from(el.querySelectorAll('.cat-type')).map(n => n.textContent?.trim());
      expect(names).toEqual(component.categories.map(c => c.name));
    });

    it('should render product cards for New Arrivals and Most Popular', () => {
      component.newArrivals = [
        { id: 1, name: 'Saffron', price: 10, image: 'assets/Images/saffron.jpg' },
      ];
      component.popularProducts = [
        { id: 2, name: 'Paprika', price: 5, image: 'assets/Images/paprika.jpg' },
        { id: 3, name: 'Cumin', price: 4, image: 'assets/Images/cumin.jpg' },
      ];
      fixture.detectChanges();

      const sections = el.querySelectorAll('.card-section');
      expect(sections[0].querySelectorAll('ion-card').length).toBe(1);
      expect(sections[1].querySelectorAll('ion-card').length).toBe(2);
      expect(sections[0].textContent).toContain('Saffron');
      expect(sections[1].textContent).toContain('Cumin');
    });

    it('should render the Explore More button', () => {
      expect(el.querySelector('.explore-wrapper ion-button')?.textContent)
        .toContain('Explore More');
    });
  });

  describe('scroll fade-in', () => {
    it('should add the "show" class to observed elements',