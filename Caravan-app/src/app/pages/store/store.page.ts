import { Component, Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

interface ProductCategory { category_name: string; }

interface StoreItem {
  product_id: number;
  type_id: number; // 1 = product, 2 = bundle
  product_name: string;
  product_image: string;
  product_price: number;
  product_country?: string;
  product_category?: ProductCategory[];
}

/** Fades a card in/out as it enters/leaves the viewport (replaces the IntersectionObserver in storepage.js). */
@Directive({ selector: '[fadeIn]', standalone: true })
export class FadeInDirective implements OnInit, OnDestroy {
  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit() {
    this.observer = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('show', e.isIntersecting)),
      { threshold: 0.2 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, FadeInDirective],
  templateUrl: './store.page.html',
  styleUrls: ['./store.page.scss'],
})
export class StorePage implements OnInit {
  currentTab: 'products' | 'bundles' = 'products';
  loading = true;

  products: StoreItem[] = [];
  bundles: StoreItem[] = [];
  filteredProducts: StoreItem[] = [];
  filteredBundles: StoreItem[] = [];
  countries: string[] = [];

  // Filters
  searchInput = '';
  private appliedSearch = '';
  selectedCountry = '';
  selectedCategory = ''; // '' = All Categories

  categoryGroups = [
    { name: 'Cooking', subs: ['Appetizers / Starters', 'Main Course', 'Soups & Stews', 'Side Dishes', 'Sauce & Condiments'] },
    { name: 'Medicine', subs: ['First aid', 'Herbal Remedies & Supplements', 'Health & Wellness'] },
    { name: 'Garnishing', subs: ['Herbs & leaves', 'Edible Flowers', 'Decorative Plating'] },
    { name: 'Drinks', subs: ['Hot Beverages', 'Cold Beverages', 'Juice & Smoothies'] },
    { name: 'Baking', subs: ['Cakes', 'Breads', 'Pastries', 'Desserts'] },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  async ngOnInit() {
    try {
      const data = await firstValueFrom(this.http.get<StoreItem[]>('/api/fetchProducts'));
      this.products = data.filter(i => Number(i.type_id) === 1);
      this.bundles = data.filter(i => Number(i.type_id) === 2);
      this.countries = [
        ...new Set(this.products.map(p => p.product_country).filter((c): c is string => !!c)),
      ].sort();
      this.applyFilters();
    } catch (e) {
      console.error('Error loading items:', e);
    } finally {
      this.loading = false;
    }
  }

  // ---------- Tabs / search / filters ----------

  switchTab(tab: 'products' | 'bundles') {
    this.currentTab = tab;
    this.applyFilters();
  }

  search() {
    this.applyFilters();
  }

  applyFilters() {
    this.appliedSearch = this.searchInput.trim().toLowerCase();
    const byName = (a: StoreItem, b: StoreItem) => a.product_name.localeCompare(b.product_name);

    this.filteredProducts = this.products
      .filter(p => {
        const matchesCategory =
          !this.selectedCategory ||
          (p.product_category ?? []).some(c => c.category_name === this.selectedCategory);
        const matchesCountry = !this.selectedCountry || p.product_country === this.selectedCountry;
        const matchesSearch = p.product_name.toLowerCase().includes(this.appliedSearch);
        return matchesCategory && matchesCountry && matchesSearch;
      })
      .sort(byName);

    this.filteredBundles = this.bundles
      .filter(b => b.product_name.toLowerCase().includes(this.appliedSearch))
      .sort(byName);
  }

  // ---------- Navigation ----------

  openItem(item: StoreItem) {
    const key = Number(item.type_id) === 2 ? 'bundleId' : 'productId';
    this.router.navigate(['/product'], { queryParams: { [key]: item.product_id } });
  }
}