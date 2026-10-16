import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from '../../services/settings.service';

interface ProductCategory { category_name: string; }

interface StoreItem {
  product_id: number;
  type_id: number;
  product_name: string;
  product_image: string;
  product_price: number;
  product_likes: number;
  product_rating: number;
  review_count: number;
  product_country?: string;
  product_category?: ProductCategory[];
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonSpinner],
  templateUrl: './store.page.html',
  styleUrls: ['./store.page.scss'],
})
export class StorePage implements OnInit {
  currentTab: 'products' | 'bundles' = 'products';
  loading = true;
  error = '';
  products: StoreItem[] = [];
  bundles: StoreItem[] = [];
  countries: string[] = [];

  searchInput = '';
  selectedCountry = '';
  selectedCategory = '';
  minimumPrice: number | null = null;
  maximumPrice: number | null = null;
  currentPage = 1;
  readonly pageSize = 30;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
    readonly settings: SettingsService,
  ) {}

  ngOnInit(): void { void this.loadItems(); }

  get availableCategories(): string[] {
    const items = [...this.products, ...this.bundles];
    return [...new Set(items.flatMap(item => (item.product_category ?? [])
      .map(category => category.category_name?.trim())
      .filter((name): name is string => !!name)))].sort((a, b) => a.localeCompare(b));
  }

  get filteredItems(): StoreItem[] {
    const search = this.searchInput.trim().toLocaleLowerCase();
    return this.activeItems
      .filter(item => !search || item.product_name.toLocaleLowerCase().includes(search))
      .filter(item => !this.selectedCountry || item.product_country === this.selectedCountry)
      .filter(item => !this.selectedCategory || (item.product_category ?? [])
        .some(category => category.category_name === this.selectedCategory))
      .filter(item => this.minimumPrice === null || item.product_price >= this.minimumPrice)
      .filter(item => this.maximumPrice === null || item.product_price <= this.maximumPrice)
      .sort((a, b) => a.product_name.localeCompare(b.product_name));
  }

  get visibleItems(): StoreItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
  }

  get activeItems(): StoreItem[] {
    return this.currentTab === 'products' ? this.products : this.bundles;
  }

  async loadItems(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const data = await firstValueFrom(this.http.get<StoreItem[]>('/api/fetchProducts'));
      this.products = data.filter(item => Number(item.type_id) === 1);
      this.bundles = data.filter(item => Number(item.type_id) === 2);
      this.countries = [...new Set(data.map(item => item.product_country?.trim())
        .filter((country): country is string => !!country))].sort((a, b) => a.localeCompare(b));
      this.clampPage();
    } catch (error) {
      console.error('Unable to load store items:', error);
      this.error = 'Unable to load products right now. Please try again.';
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }

  switchTab(tab: 'products' | 'bundles'): void {
    this.currentTab = tab;
    this.selectedCategory = '';
    this.currentPage = 1;
  }

  filtersChanged(): void {
    this.currentPage = 1;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
  }

  goToPage(value: unknown): void {
    const page = Number(value);
    if (!Number.isFinite(page)) return;
    this.currentPage = Math.max(1, Math.min(this.totalPages, Math.trunc(page)));
  }

  previousPage(): void { this.goToPage(this.currentPage - 1); }
  nextPage(): void { this.goToPage(this.currentPage + 1); }

  openItem(item: StoreItem): void {
    const param = Number(item.type_id) === 2 ? 'bundleId' : 'productId';
    void this.router.navigate(['/product'], { queryParams: { [param]: item.product_id } });
  }

  starString(item: StoreItem): string {
    const filled = Math.max(0, Math.min(5, Math.round(Number(item.product_rating) || 0)));
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }

  ratingLabel(item: StoreItem): string {
    const count = Number(item.review_count) || 0;
    return count ? `${Number(item.product_rating).toFixed(1)} (${count})` : 'No ratings';
  }

  formatCurrency(value: number): string {
    return this.settings.formatCurrency(value);
  }

  imageFailed(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = 'assets/Images/ItemNotFound_nobg.png';
  }

  private clampPage(): void {
    this.currentPage = Math.min(Math.max(1, this.currentPage), this.totalPages);
  }
}
