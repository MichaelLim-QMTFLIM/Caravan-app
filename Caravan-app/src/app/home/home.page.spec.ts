import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('data', () => {
    it('should have 4 features with icons, titles and text', () => {
      expect(component.features.length).toBe(4);
      component.features.forEach(feature => {
        expect(feature.icon).toContain('assets/Images/');
        expect(feature.title).toBeTruthy();
        expect(feature.text).toBeTruthy();
      });
    });

    it('should have the 5 categories with matching image paths', () => {
      expect(component.categories.map(category => category.name)).toEqual([
        'Baking', 'Drinking', 'Cooking', 'Garnishing', 'Medicinal',
      ]);
      component.categories.forEach(category => {
        expect(category.image).toBe(`assets/Images/${category.name}.jpg`);
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
      const names = Array.from(el.querySelectorAll('.cat-type')).map(node => node.textContent?.trim());
      expect(names).toEqual(component.categories.map(category => category.name));
    });

    it('should render product cards for New Arrivals and Most Popular', () => {
      fixture.destroy();
      fixture = TestBed.createComponent(HomePage);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
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
      expect(el.querySelector('.explore-wrapper ion-button')?.textContent).toContain('Explore More');
    });
  });

  describe('scroll fade-in', () => {
    it('should observe the animated elements and reveal intersecting ones', async () => {
      const observed: Element[] = [];
      let callback: IntersectionObserverCallback | undefined;
      const unobserve = vi.fn();

      vi.stubGlobal('IntersectionObserver', class {
        readonly root = null;
        readonly rootMargin = '';
        readonly thresholds: ReadonlyArray<number> = [];

        constructor(observerCallback: IntersectionObserverCallback) {
          callback = observerCallback;
        }

        observe = vi.fn((element: Element) => observed.push(element));
        unobserve = unobserve;
        disconnect = vi.fn();
        takeRecords = vi.fn((): IntersectionObserverEntry[] => []);
      });

      vi.useFakeTimers();
      component.ngAfterViewInit();
      await vi.advanceTimersByTimeAsync(300);

      expect(observed.length).toBeGreaterThan(0);
      const element = observed[0];
      callback?.([{ isIntersecting: true, target: element } as IntersectionObserverEntry], {} as IntersectionObserver);
      expect(element.classList.contains('show')).toBe(true);
      expect(unobserve).toHaveBeenCalledWith(element);
    });
  });
});
