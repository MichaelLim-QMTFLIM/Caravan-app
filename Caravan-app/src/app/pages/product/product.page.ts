import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

interface Category { category_id: number; }

interface Product {
  product_id: number;
  type_id: number; // 2 = bundle
  product_name: string;
  product_image: string;
  product_price: number;
  product_likes: number;
  product_country?: string;
  product_desc?: string;
  product_category?: Category[];
}

interface CartItem {
  cartprod_id: number | null;
  cartbundle_id: number | null;
  cartprod_size: string;
  quantity: number;
  isBundle: boolean;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
})
export class ProductPage implements OnInit {
  isBundle = false;
  itemId = 0;
  item?: Product;
  loading = true;
  error = '';

  size: '8oz' | '16oz' = '8oz';
  liked = false;
  likeCount = 0;
  wishlistBusy = false;

  similar: Product[] = [];
  random: Product[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private http: HttpClient,
    private alerts: AlertController,
  ) {}

  ngOnInit() {
    // Re-runs when navigating product -> product (same component instance)
    this.route.queryParamMap.subscribe(params => {
      const bundleId = Number(params.get('bundleId'));
      const productId = Number(params.get('productId'));
      this.isBundle = !!bundleId;
      this.itemId = bundleId || productId;
      this.load();
    });
  }

  get price(): string {
    const multiplier = this.size === '8oz' ? 8 : 16;
    return ((Number(this.item?.product_price) || 0) * multiplier).toFixed(2);
  }

  // ---------- Loading ----------

  private async load() {
    this.loading = true;
    this.error = '';
    this.liked = false;
    try {
      const [itemData, all] = await Promise.all([
        firstValueFrom(
          this.http.get<Product | Product[]>('/api/fetchProducts', { params: { productId: this.itemId } })
        ),
        firstValueFrom(this.http.get<Product[]>('/api/fetchProducts')),
      ]);

      const item = Array.isArray(itemData) ? itemData[0] : itemData;
      if (!item) throw new Error('not found');
      if (this.isBundle && Number(item.type_id) !== 2) throw new Error('not a bundle');

      this.item = item;
      this.likeCount = Number(item.product_likes) || 0;
      this.similar = this.shuffle(this.getSimilar(item, all)).slice(0, 7);
      this.random = this.shuffle(all.filter(p => +p.product_id !== +item.product_id)).slice(0, 7);
    } catch (e) {
      console.error('Error loading item:', e);
      this.error = `Unable to load this ${this.isBundle ? 'bundle' : 'product'}.`;
    } finally {
      this.loading = false;
    }
  }

  private getSimilar(item: Product, all: Product[]): Product[] {
    const mine = item.product_category ?? [];
    return all.filter(o => {
      if (+o.product_id === +item.product_id) return false;
      const sameCountry = o.product_country === item.product_country;
      const sameCategory = (o.product_category ?? []).some(oc =>
        mine.some(c => +c.category_id === +oc.category_id));
      return sameCountry || sameCategory;
    });
  }

  private shuffle<T>(items: T[]): T[] {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Navigation ----------

  goBack() {
    this.location.back();
  }

  openItem(p: Product) {
    const key = Number(p.type_id) === 2 ? 'bundleId' : 'productId';
    this.router.navigate(['/product'], { queryParams: { [key]: p.product_id } });
  }

  goToReviews() {
    const queryParams = this.isBundle ? { bundleId: this.itemId } : { productId: this.itemId };
    this.router.navigate(['/user/reviews'], { queryParams: this.itemId ? queryParams : {} });
  }

  // ---------- Likes ----------

  toggleLike() {
    this.liked = !this.liked;
    this.likeCount += this.liked ? 1 : -1;
    // TODO: persist like count to the database
  }

  // ---------- Alerts ----------

  private async message(header: string, message: string, buttons: any[] = ['Okay']) {
    const alert = await this.alerts.create({ header, message, buttons, cssClass: 'caravan-alert' });
    await alert.present();
  }

  private promptLogin() {
    return this.message('LOGIN REQUIRED', 'You need to be logged in to add items to your cart.', [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Login', handler: () => this.router.navigate(['/login']) },
    ]);
  }

  private async isLoggedIn(): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.get<{ loggedIn: boolean }>('/api/isLoggedIn'));
      return !!res?.loggedIn;
    } catch {
      return false;
    }
  }

  // ---------- Cart ----------

  async addToCart() {
    if (!(await this.isLoggedIn())) return this.promptLogin();

    const alert = await this.alerts.create({
      header: 'ADD TO CART?',
      message: '🛒',
      cssClass: 'caravan-alert',
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Yes', handler: () => this.confirmAddToCart() },
      ],
    });
    await alert.present();
  }

  private confirmAddToCart() {
    const type = this.isBundle ? 'bundle' : 'product';
    if (!this.itemId) return this.message('CART ERROR', 'Unable to identify this item.');

    let cart: CartItem[] = [];
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { cart = []; }

    const exists = cart.some(i =>
      i.isBundle === this.isBundle &&
      Number(this.isBundle ? i.cartbundle_id : i.cartprod_id) === this.itemId &&
      i.cartprod_size === this.size
    );
    if (exists) {
      return this.message('ALREADY IN CART', `This ${type} with the selected size is already in your cart.`);
    }

    cart.push({
      cartprod_id: this.isBundle ? null : this.itemId,
      cartbundle_id: this.isBundle ? this.itemId : null,
      cartprod_size: this.size,
      quantity: 1,
      isBundle: this.isBundle,
    });
    localStorage.setItem('cart', JSON.stringify(cart));

    return this.message('SUCCESS', `Your ${type} has been added to your cart.`);
  }

  // ---------- Wishlist ----------

  async addToWishlist() {
    if (!this.itemId) return this.message('WISHLIST ERROR', 'Unable to identify this item.');

    this.wishlistBusy = true;
    try {
      const res = await firstValueFrom(
        this.http.post<{ alreadyExists?: boolean }>('/api/addWishlist', { productId: this.itemId })
      );
      if (res?.alreadyExists) {
        return this.message('ALREADY IN WISHLIST', 'This item is already in your wishlist.');
      }
      return this.message('WISHLIST', 'Item added to wishlist.');
    } catch (e) {
      const err = e as HttpErrorResponse;
      if (err.status === 401) return this.promptLogin();
      if (err.status === 409 || err.error?.alreadyExists) {
        return this.message('ALREADY IN WISHLIST', 'This item is already in your wishlist.');
      }
      return this.message('WISHLIST ERROR', err.error?.error || 'Unable to add item to wishlist.');
    } finally {
      this.wishlistBusy = false;
    }
  }
}