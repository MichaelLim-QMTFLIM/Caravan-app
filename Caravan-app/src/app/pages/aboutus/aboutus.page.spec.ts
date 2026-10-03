import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutUsPage } from './aboutus.page';

describe('AboutUsPage', () => {
  let component: AboutUsPage;
  let fixture: ComponentFixture<AboutUsPage>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUsPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutUsPage);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('data', () => {
    it('should have 5 team members', () => {
      expect(component.team.length).toBe(5);
    });

    it('should give every member a name and a photo path', () => {
      component.team.forEach(m => {
        expect(m.name).toBeTruthy();
        expect(m.photo).toContain('assets/Images/');
      });
    });

    it('should list the expected members', () => {
      expect(component.team.map(m => m.name)).toEqual([
        'Demillo, Orland Gabriel',
        'Ghazal, Iyad Michael',
        'Lim, Michael Terrence',
        'Narvarte, Michael Ray',
        'Paulino, John Lois',
      ]);
    });
  });

  describe('template', () => {
    it('should render the team title', () => {
      expect(el.querySelector('.team-title')?.textContent).toContain('Meet the Caravan Team');
    });

    it('should render one team member per entry', () => {
      expect(el.querySelectorAll('.team-member').length).toBe(component.team.length);
    });

    it('should render member names and use them as image alt text', () => {
      const names = Array.from(el.querySelectorAll('.team-name')).map(n => n.textContent?.trim());
      expect(names).toEqual(component.team.map(m => m.name));

      const alts = Array.from(el.querySelectorAll('.team-photo')).map(i => i.getAttribute('alt'));
      expect(alts).toEqual(component.team.map(m => m.name));
    });

    it('should render the About Us section', () => {
      expect(el.querySelector('.about-title')?.textContent).toContain('About Us');
      expect(el.querySelector('.about-subtitle')?.textContent).toContain('founded in 2026');
    });

    it('should render both Mission and Vision boxes', () => {
      const titles = Array.from(el.querySelectorAll('.mission-vision-title'))
        .map(t => t.textContent?.trim());
      expect(titles).toEqual(['Mission', 'Vision']);
    });
  });

  describe('scroll fade-in', () => {
    it('should add the "show" class to observed elements', () => {
      const original = window.IntersectionObserver;

      (window as any).IntersectionObserver = class {
        constructor(private cb: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.cb([{ isIntersecting: true, target } as IntersectionObserverEntry], this as any);
        }
        unobserve() {}
        disconnect() {}
      };

      const f = TestBed.createComponent(AboutUsPage);
      f.detectChanges(); // runs ngAfterViewInit

      const titles = f.nativeElement.querySelectorAll('.fade-title');
      expect(titles.length).toBe(3);
      titles.forEach((t: Element) => expect(t.classList).toContain('show'));

      window.IntersectionObserver = original;
    });
  });
});